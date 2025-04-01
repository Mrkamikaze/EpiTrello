from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .serializers import TableSerializer, SimpleTableSerializer
from kanban.models import Table


class TableView(APIView):
    queryset = Table.objects.all()
    serializer_class = TableSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request}

    def get(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Forbidden'}, status=403)
        tables = Table.objects.filter(user=request.user)
        serializer = SimpleTableSerializer(tables, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = TableSerializer(data=request.data, context=self.get_serializer_context())

        if serializer.is_valid():
            table = serializer.save()
            return Response(
                {
                    "message": "Successfully created new table",
                    "table_name": table.name,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, table_id):
        try:
            table = Table.objects.get(id=table_id, user=request.user)
        except Table.DoesNotExist:
            return Response(
                {"error": "Table not found or access denied."},
                status=status.HTTP_404_NOT_FOUND
            )

        new_name = request.data.get("name", None)
        if not new_name:
            return Response({"error": "New name is required."}, status=status.HTTP_400_BAD_REQUEST)

        table.name = new_name
        table.save()

        return Response(
            {"message": "Table name updated successfully", "table_name": table.name},
            status=status.HTTP_200_OK
        )


class TableDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, board_id):
        board = get_object_or_404(Table, id=board_id, user=request.user)
        serializer = TableSerializer(board)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, board_id):
        pass

    def patch(self, request, board_id):
        board = get_object_or_404(Table, id=board_id, user=request.user)

        new_name = request.data.get("name", None)
        if not new_name:
            return Response({"error": "New name is required."}, status=status.HTTP_400_BAD_REQUEST)

        board.name = new_name
        board.save()

        return Response(
            {"message": "Board name updated successfully", "board_name": board.name},
            status=status.HTTP_200_OK
        )

    def delete(self, request, board_id):
        table = get_object_or_404(Table, id=board_id, user=request.user)
        table.delete()
        return Response(
            {"message": "Successfully deleted board."},
            status=status.HTTP_204_NO_CONTENT
        )