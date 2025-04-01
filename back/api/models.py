from django.db import models

# Create your models here.

class KanbanTable:
    def __init__(self, table):
        self.table = table