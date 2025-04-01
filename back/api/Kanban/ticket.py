from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from kanban.models import Ticket, List, Table
from .serializers import TicketSerializer
from django.db import transaction

class TicketView(APIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self, list_id):
        return {'request': self.request, 'list_id': list_id}

    def get(self, request, board_id, list_id):
        try:
            board = Table.objects.get(id=board_id, user=request.user)
            list_instance = List.objects.get(id=list_id, board=board)
        except Table.DoesNotExist:
            return Response({"error": "Board not found or access denied."}, status=status.HTTP_404_NOT_FOUND)
        except List.DoesNotExist:
            return Response({"error": "List not found or access denied."}, status=status.HTTP_404_NOT_FOUND)

        tickets = Ticket.objects.filter(list=list_instance).order_by('position')
        serializer = TicketSerializer(tickets, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, board_id, list_id):
        print(request)
        try:
            board = Table.objects.get(id=board_id, user=request.user)
            list_instance = List.objects.get(id=list_id, board=board)
        except Table.DoesNotExist:
            return Response({"error": "Board not found or access denied."}, status=status.HTTP_404_NOT_FOUND)
        except List.DoesNotExist:
            return Response({"error": "List not found or access denied."}, status=status.HTTP_404_NOT_FOUND)

        last_ticket = Ticket.objects.filter(list=list_instance).order_by("-position").first()
        new_position = (last_ticket.position + 1) if last_ticket else 1

        request.data["position"] = new_position

        serializer = TicketSerializer(data=request.data, context=self.get_serializer_context(list_id))

        if serializer.is_valid():
            ticket = serializer.save(list=list_instance)
            return Response(
                {
                    "message": "Successfully created new ticket",
                    "ticket_name": ticket.name,
                    "ticket_id": ticket.id,
                    "position": ticket.position,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, board_id, list_id, ticket_id):
        try:
            board = Table.objects.get(id=board_id, user=request.user)
            list_instance = List.objects.get(id=list_id, board=board)
            ticket = Ticket.objects.get(id=ticket_id, list=list_instance)
        except Table.DoesNotExist:
            return Response({"error": "Board not found or access denied."}, status=status.HTTP_404_NOT_FOUND)
        except List.DoesNotExist:
            return Response({"error": "List not found or access denied."}, status=status.HTTP_404_NOT_FOUND)
        except Ticket.DoesNotExist:
            return Response({"error": "Ticket not found or access denied."}, status=status.HTTP_404_NOT_FOUND)

        serializer = TicketSerializer(ticket, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Ticket updated successfully",
                    "ticket": serializer.data,
                },
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TicketAllView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, board_id):
        try:
            board = Table.objects.get(id=board_id, user=request.user)
        except Table.DoesNotExist:
            return Response({"error": "Board not found or access denied."}, status=status.HTTP_404_NOT_FOUND)

        lists = List.objects.filter(board=board).order_by('position')
        tickets = Ticket.objects.filter(list__board=board).order_by('position')

        lists_data = {
            lst.id: {
                "id": str(lst.id),
                "title": lst.name,
                "position": lst.position,
                "tasks": []
            }
            for lst in lists
        }

        for ticket in tickets:
            lists_data[ticket.list.id]["tasks"].append({
                "id": str(ticket.id),
                "text": ticket.name,
                "position": ticket.position,
                "label": ticket.label,
                "due_date": ticket.due_date
            })

        print(lists_data)
        return Response(list(lists_data.values()), status=status.HTTP_200_OK)


class TicketReorderView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, list_id):
        try:
            list_instance = List.objects.get(id=list_id, board__user=request.user)
        except List.DoesNotExist:
            return Response({"error": "List not found or access denied."}, status=status.HTTP_404_NOT_FOUND)

        tickets_data = request.data.get("tickets", [])

        if not isinstance(tickets_data, list):
            return Response({"error": "Invalid format. Expected a list of tickets."}, status=status.HTTP_400_BAD_REQUEST)

        ticket_ids = [t["id"] for t in tickets_data]

        tickets = Ticket.objects.filter(id__in=ticket_ids, list=list_instance)

        if tickets.count() != len(tickets_data):
            return Response({"error": "Some tickets were not found or access is denied."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            for ticket_data in tickets_data:
                try:
                    ticket = Ticket.objects.get(id=ticket_data["id"], list=list_instance)
                    ticket.position = ticket_data["position"]

                    new_list_id = ticket_data.get("list_id", list_id)
                    if new_list_id != list_id:
                        try:
                            new_list = List.objects.get(id=new_list_id, board__user=request.user)
                            ticket.list = new_list
                        except List.DoesNotExist:
                            return Response({"error": "Target list not found or access denied."}, status=status.HTTP_400_BAD_REQUEST)

                    ticket.save()
                except Ticket.DoesNotExist:
                    continue

        return Response({"message": "Tickets reordered successfully."}, status=status.HTTP_200_OK)


class TicketDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, board_id, list_id, ticket_id, user):
        try:
            board = Table.objects.get(id=board_id, user=user)
            list_instance = List.objects.get(id=list_id, board=board)
            ticket = Ticket.objects.get(id=ticket_id, list=list_instance)
            return ticket
        except Table.DoesNotExist:
            raise Response({"error": "Board not found or access denied."}, status=status.HTTP_404_NOT_FOUND)
        except List.DoesNotExist:
            raise Response({"error": "List not found or access denied."}, status=status.HTTP_404_NOT_FOUND)
        except Ticket.DoesNotExist:
            raise Response({"error": "Ticket not found or access denied."}, status=status.HTTP_404_NOT_FOUND)

    def get(self, request, board_id, list_id, id):
        ticket = self.get_object(board_id, list_id, id, request.user)
        if isinstance(ticket, Response):
            return ticket

        serializer = TicketSerializer(ticket)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, board_id, list_id, id):
        ticket = self.get_object(board_id, list_id, id, request.user)
        if isinstance(ticket, Response):
            return ticket

        new_name = request.data.get("name", ticket.name)
        new_description = request.data.get("description", ticket.description)
        new_list_id = request.data.get("list_id", ticket.list.id)
        new_due_date = request.data.get("due_date", ticket.due_date)
        new_label = request.data.get("label", ticket.label)
        print("new date :", new_due_date, "label", new_label)

        if new_due_date == [None, None]:
            new_due_date = ticket.due_date

        if new_label == "":
            new_label = ticket.label

        if new_list_id != ticket.list.id:
            try:
                new_list = List.objects.get(id=new_list_id, board=ticket.list.board)
                ticket.list = new_list
            except List.DoesNotExist:
                return Response(
                    {"error": "Target list not found or not in the same board."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        ticket.name = new_name
        ticket.description = new_description
        ticket.due_date = new_due_date
        ticket.label = new_label
        ticket.save()

        return Response(
            {
                "message": "Ticket updated successfully",
                "ticket": {
                    "id": ticket.id,
                    "name": ticket.name,
                    "description": ticket.description,
                    "list_id": ticket.list.id,
                    "due_date": ticket.due_date,
                    "label": ticket.label,
                },
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, board_id, list_id, id):
        ticket = self.get_object(board_id, list_id, id, request.user)
        ticket.delete()
        return Response(
            {"message": "Successfully deleted ticket."},
            status=status.HTTP_204_NO_CONTENT
        )
