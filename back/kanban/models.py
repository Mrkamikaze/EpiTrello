from django.db import models
from django.contrib.auth.models import User

class Table(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='boards')
    name = models.CharField(max_length=100)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class List(models.Model):
    board = models.ForeignKey(Table, on_delete=models.CASCADE, related_name='lists')
    name = models.CharField(max_length=100)
    position = models.PositiveIntegerField(default=0)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Ticket(models.Model):
    LABEL_CHOICES = [
        ('yellow', 'Jaune'),
        ('orange', 'Orange'),
        ('red', 'Rouge'),
        ('purple', 'Violet'),
    ]

    list = models.ForeignKey(List, on_delete=models.CASCADE, related_name='cards')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    position = models.PositiveIntegerField(default=0)
    due_date = models.DateField(blank=True, null=True)
    label = models.CharField(max_length=10, choices=LABEL_CHOICES, blank=True, null=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name