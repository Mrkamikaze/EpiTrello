from django.contrib.auth.models import User
from rest_framework import serializers

from kanban.models import Table, List, Ticket

class SimpleTableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Table
        fields = ['id', 'name']

class TableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Table
        fields = ['name', 'user_id', 'date_created', 'date_updated']
        read_only_fields = ['user_id', 'date_created', 'date_updated']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user:
            user = request.user
        else:
            raise serializers.ValidationError("User is not authenticated.")
        table = Table.objects.create(
            name=validated_data['name'],
            user=user,
        )
        return table

class ListSerializer(serializers.ModelSerializer):
    class Meta:
        model = List
        fields = ['id', 'name', 'position', 'date_created', 'date_updated']
        read_only_fields = ['date_created', 'date_updated']

    def create(self, validated_data):
        board_id = self.context.get('board_id')
        request = self.context.get('request')
        print(board_id)

        if not board_id:
            raise serializers.ValidationError("Board ID is required.")
        try:
            board = Table.objects.get(id=board_id, user=request.user)
        except Table.DoesNotExist:
            raise serializers.ValidationError("Board not found or access denied.")

        list_instance = List.objects.create(board=board, **validated_data)
        return list_instance

class TicketSerializer(serializers.ModelSerializer):
    list_id = serializers.IntegerField(source='list.id', read_only=True)
    class Meta:
        model = Ticket
        fields = ['id', 'name', 'description', 'position', 'list_id', 'date_created', 'date_updated', 'due_date', 'label']
        read_only_fields = ['date_created', 'date_updated']

    def get_board_id(self, obj):
        return obj.list.board.id

    def create(self, validated_data):
        list_id = self.context.get('list_id')
        request = self.context.get('request')

        if not list_id:
            raise serializers.ValidationError("List ID is required.")
        try:
            list_instance = List.objects.get(id=list_id, board__user=request.user)
        except List.DoesNotExist:
            raise serializers.ValidationError("List not found or access denied.")
        validated_data.pop('list', None)
        ticket = Ticket.objects.create(list=list_instance, **validated_data)
        return ticket