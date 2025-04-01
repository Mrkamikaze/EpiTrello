# EpiTrello

This side project has been made by me, Romain Zhang. And that's it ! It took approximatively 1 month 
to implement most features. Why this project ? I wanted to challenge myself on a fullstack project that
has a simple back end but a little challenging front end.

If you have any question, here is my email : 
romain.zhang@epitech.eu

## Back

First, we need to move to the backend directory. It is important to run 
the backend server before the front one. 

```
cd back/
```

to setup the database, execute these commands
```
python3 manage.py makemigrations
python3 manage.py migrate
```

then, to run the server, execute this command
```
python3 manage.py runserver
```

## Front

move to the front directory
```
cd ../front/
```

to run the front server, execute this command. It will automatically take you to your browser and display the home page
```
npm start
```

## Guide

### Login
If you do not land on the login screen, please, click on the red button "Disconnection"

on the login screen, you can choose to login or to register. If you are on a hurry, you can use these credentials :

Email : test_user@gmail.com
Password : azerty!A411

If you are using the website and that nothing (eg. no boards, no lists etc..) is displaying or
that you cannot create anything, please do the same thing here.

### Boards
Next, you can see that there is already a board that has been created. A board contains
lists of taks. You can create several of them.

You can check "test_board" and see that there are 3 lists already with some tasks here. 
We will see how to use them later. To return in the homepage, click on "EpiTrello" on the
upper left corner of your screen.

### Lists
You can create a board with the "+ New Board" button. You can give it a 
name. When created, you can click on it to enter in the board. You will see that
it is empty. To give it a little more life, click on "+ Add List" and give it a name.

If you have more than one list, you can move them by grabbing the blue rectangle that contains
the name of the list. You can also rename the list by clicking on its actual name or 
remove a list by clicking on the red cross.

### Ticket
Click on "+ Add Task" to create a task ticket. You can give it a name and a description.
When you click on a ticket, you will be able to change its title, description but now you 
can also give it a deadline and a color, or even delete it. Give it as deadline 01/04/2025
and click on the button "Save". It's normal if the date isn't displayed after you selected it.

You can move a ticket from a list that contains it to another. There are some issues with
tickets from the first list when they are moved. Create some tickets in the second list if
you want to see how they move.

### Other features
You can see a button "Open" on the left side. Using with will give you a quick access to other tables
that you have created.

There is also the "Catch up" button. If you followed the instructions correctly, you should be able to
a ticket wrapped in red. In this same interface, click on the "Calendar" button and move to March. You will see
the task on the calendar in red. If you give to another ticket a deadline that is ulterior to today's date, you
will see it with a blue color on the calendar


For any additionnal question, please contact me on this email : romain.zhang@epitech.eu
