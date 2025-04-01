from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import models, transaction
from kanban.models import List, Table
from .serializers import ListSerializer


class ListView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, board, list_id):
        try:
            return List.objects.get(id=list_id, board=board)
        except List.DoesNotExist:
            return None

    def get_serializer_context(self, board_id):
        return {'request': self.request, 'board_id': board_id}

    def get(self, request, board_id):
        try:
            board = Table.objects.get(id=board_id, user=request.user)
        except Table.DoesNotExist:
            return Response({"error": "Board not found or access denied."}, status=status.HTTP_404_NOT_FOUND)

        lists = List.objects.filter(board=board).order_by('position')
        serializer = ListSerializer(lists, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, board_id):
        try:
            board = Table.objects.get(id=board_id, user=request.user)
        except Table.DoesNotExist:
            return Response({"error": "Board not found or access denied."}, status=status.HTTP_404_NOT_FOUND)

        max_position = List.objects.filter(board=board).aggregate(max_position=models.Max('position'))['max_position'] or 0
        new_position = max_position + 1

        request.data['position'] = new_position

        serializer = ListSerializer(data=request.data, context=self.get_serializer_context(board_id))

        if serializer.is_valid():
            list_instance = serializer.save()
            return Response(
                {
                    "message": "Successfully created new list",
                    "list_name": list_instance.name,
                    "list_id": list_instance.id,
                    "position": list_instance.position,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, board_id):
        try:
            board = Table.objects.get(id=board_id, user=request.user)
        except Table.DoesNotExist:
            return Response({"error": "Board not found or access denied."}, status=status.HTTP_404_NOT_FOUND)

        list_id = request.data.get("list_id")
        if not list_id:
            return Response({"error": "list_id is required in the request body."}, status=status.HTTP_400_BAD_REQUEST)

        list_instance = self.get_object(board, list_id)
        if not list_instance:
            return Response({"error": "List not found or access denied."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ListSerializer(list_instance, data=request.data, partial=True,
                                    context={"request": request, "board_id": board_id})

        if serializer.is_valid():
            updated_list = serializer.save()
            return Response(
                {
                    "message": "Successfully updated list",
                    "list_id": updated_list.id,
                    "list_name": updated_list.name,
                    "position": updated_list.position,
                },
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, board_id, list_id):
        try:
            board = Table.objects.get(id=board_id, user=request.user)
        except Table.DoesNotExist:
            return Response({"error": "Board not found or access denied."}, status=status.HTTP_404_NOT_FOUND)

        list_instance = self.get_object(board, list_id)
        if not list_instance:
            return Response({"error": "List not found or access denied."}, status=status.HTTP_404_NOT_FOUND)

        new_position = request.data.get("position")
        if new_position is None:
            return Response({"error": "New position is required."}, status=status.HTTP_400_BAD_REQUEST)

        lists = List.objects.filter(board=board).order_by("position")

        if new_position < 0 or new_position >= lists.count():
            return Response({"error": "Invalid position."}, status=status.HTTP_400_BAD_REQUEST)

        old_position = list_instance.position

        if new_position > old_position:
            List.objects.filter(board=board, position__gt=old_position, position__lte=new_position).update(
                position=models.F("position") - 1)
        elif new_position < old_position:
            List.objects.filter(board=board, position__lt=old_position, position__gte=new_position).update(
                position=models.F("position") + 1)

        list_instance.position = new_position
        list_instance.save()

        return Response({"message": "Successfully updated list position."}, status=status.HTTP_200_OK)

    def delete(self, request, *args, **kwargs):
        board_id = kwargs.get("board_id")
        print("board_id is:", board_id)

        try:
            board = Table.objects.get(id=board_id, user=request.user)
        except Table.DoesNotExist:
            return Response({"error": "Board not found or access denied."}, status=status.HTTP_404_NOT_FOUND)

        list_id = request.data.get("list_id")
        if not list_id:
            return Response({"error": "List ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        list_instance = self.get_object(board, list_id)
        if not list_instance:
            return Response({"error": "List not found or access denied."}, status=status.HTTP_404_NOT_FOUND)

        list_instance.delete()
        return Response(
            {"message": "Successfully deleted list."},
            status=status.HTTP_204_NO_CONTENT
        )

class allListView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, board_id):

        try:
            board = Table.objects.get(id=board_id, user=request.user)
        except Table.DoesNotExist:
            return Response({"error": "Board not found or access denied."}, status=status.HTTP_404_NOT_FOUND)

        columns_data = request.data.get("columns", [])
        if not isinstance(columns_data, list):
            return Response({"error": "Invalid data format. 'columns' should be a list."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            for col in columns_data:
                if "id" not in col or "position" not in col:
                    return Response(
                        {"error": "Each column must have 'id' and 'position' fields."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            column_ids = [int(col["id"]) for col in columns_data]
            existing_columns = List.objects.filter(board=board, id__in=column_ids)

            existing_column_ids = set(existing_columns.values_list("id", flat=True))
            received_column_ids = set(column_ids)

            missing_ids = received_column_ids - existing_column_ids
            if missing_ids:
                return Response(
                    {"error": f"Some columns were not found or access is denied: {list(missing_ids)}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            with transaction.atomic():
                for col_data in columns_data:
                    col_id = int(col_data["id"])
                    column = existing_columns.get(id=col_id)

                    serializer = ListSerializer(column, data={"position": col_data["position"]}, partial=True)

                    if serializer.is_valid():
                        serializer.save()
                    else:
                        print(f"Error in list {col_id} :", serializer.errors)
                        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            return Response({"message": "Columns successfully updated."}, status=status.HTTP_200_OK)

        except ValueError:
            return Response({"error": "Invalid column ID format. IDs should be integers."}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)