import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ReactQuill from "react-quill";
import axios from 'axios';
import './Boards.css';
import Header from '../Header';

const BoardPage = () => {
    const { id_table } = useParams();
    const [data, setData] = useState({ columns: [] });
    const [userBoards, setUserBoards] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isListPopupOpen, setIsListPopupOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
    const [selectedListId, setSelectedListId] = useState(null);
    const [currentColumnId, setCurrentColumnId] = useState(null);
    const [newListTitle, setNewListTitle] = useState('');
    const [isEditingList, setIsEditingList] = useState(false);
    const [editListTitle, setEditListTitle] = useState('');
    const [listBeingEdited, setListBeingEdited] = useState(null);
    const dueDate = useState(null);
    const [label,setLabelState ] = useState('');
    const [labelState ] = useState('');
    const navigate = useNavigate();

    const getAuthToken = async () => {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');

        if (token && !isTokenExpired(token)) {
            return token;
        }

        if (refreshToken) {
            try {
                const response = await axios.post(
                    'http://127.0.0.1:8000/refresh_token/',
                    { refreshToken },
                    {
                        headers: {
                            "Content-Type": "application/json",
                        }
                    }
                );
                const newToken = response.data.token;
                const newRefreshToken = response.data.refreshToken;
                localStorage.setItem('token', newToken);
                localStorage.setItem('refreshToken', newRefreshToken);
                return newToken;
            } catch (error) {
                console.error("Error refreshing token:", error);
                navigate('/');
            }
        }
        navigate('/');
    };

    const isTokenExpired = (token) => {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const exp = decoded.exp;
        const currentTime = Math.floor(Date.now() / 1000);
        return exp < currentTime;
    };

    const handleRequest = async (url, method = 'GET', data = null) => {
        const token = await getAuthToken();
        try {
            const response = await axios({
                method,
                url,
                data,
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
            });
            return response.data;
        } catch (error) {
            console.error(`Error in ${method} request:`, error);
            if (error.response && error.response.status === 401) {
                navigate('/');
            }
        }
    };

    useEffect(() => {
        if (id_table) {
            fetchData();
            fetchUserBoards();
        }
    }, [id_table]);

    useEffect(() => {
        if (selectedTask && label !== selectedTask.label) {
            setLabel(selectedTask.id, label);
        }
    }, [label, selectedTask]);
    const fetchUserBoards = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get(`http://127.0.0.1:8000/kanban/table/`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
            });
            setUserBoards(response.data);
        } catch (error) {
            console.error("Error fetching user boards:", error);
        }
    };

    const addTable = async () => {
        const token = localStorage.getItem('token');
        try {
            const payload = {
                name: newListTitle || "New Table",
                position: 1,
            };

            await axios.post(
                `http://127.0.0.1:8000/kanban/${id_table}/list/`,
                payload,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                    },
                }
            );
            fetchData();
            setIsListPopupOpen(false);
        } catch (error) {
            console.error("Error adding list:", error);
        }
    };

    const fetchData = async () => {
        const token = await getAuthToken();
        const tokenExpiry = localStorage.getItem('refreshToken');
        try {
            const response = await axios.get(`http://127.0.0.1:8000/kanban/list/${id_table}/`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
            });
            console.log("expiry is: ", tokenExpiry)
            setData({ columns: response.data });
        } catch (error) {
            console.error("Error fetching board data:", error);
        }
    };

    const fetchTicketDescription = async (boardId, listId, ticketId) => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get(`http://127.0.0.1:8000/kanban/${boardId}/${listId}/ticket/${ticketId}/`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
            });
            return response.data.description;
        } catch (error) {
            console.error("Error fetching ticket description:", error);
            return '';
        }
    };

    const getLabelColor = (task) => {
        switch (task.label) {
            case 'yellow':
                return '#FFD700';
            case 'orange':
                return'#ff6a00';
            case 'red':
                return'#ff0000';
            case 'purple':
                return'#ad08ad';
            case 'default':
                return '#7c7cdc';
        }
    };

    const confirmDeleteList = (listId) => {
        setSelectedListId(listId);
        setIsDeletePopupOpen(true);
    };

    const deleteList = async () => {
        console.log("list is this one: ", selectedListId);
        if (!selectedListId || !id_table) return;

        const token = localStorage.getItem('token');
        try {
            await axios.delete(
                `http://127.0.0.1:8000/kanban/${id_table}/list/`,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Accept": "application/json",
                        "Content-Type": "application/json"
                    },
                    data: {
                        list_id: selectedListId
                    }
                }
            );
            fetchData();
            setIsDeletePopupOpen(false);
            setSelectedListId(null);
        } catch (error) {
            console.error("Error deleting list:", error);
        }
    };

    const openPopup = async (task, columnId) => {
        setSelectedTask(task);
        setCurrentColumnId(columnId);

        if (!task) {
            setNewTitle('');
            setNewDescription('');
        } else {
            setNewTitle(task.text);
            setNewDueDate(task.dueDate || '');
            //setLabel(task.label);

            const description = await fetchTicketDescription(id_table, columnId, task.id);
            setNewDescription(description);
        }

        setIsPopupOpen(true);
    };

    const closePopup = () => {
        setIsPopupOpen(false);
        setIsListPopupOpen(false);
        setSelectedTask(null);
        setCurrentColumnId(null);
    };

    const saveChanges = async () => {
        const token = localStorage.getItem('token');

        const formatDateForBackend = (date) => {
            if (!date) return null;
            console.log("Date:", date);

            if (date instanceof Date) {
                return date.toISOString().split("T")[0];
            }

            if (typeof date === "string") {
                const parts = date.split("-");
                if (parts.length === 3) {
                    if (parseInt(parts[0]) > 12) {
                        return `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                }
                return date;
            }

            return null;
        };

        try {   //Savep
            const payload = {
                name: newTitle,
                description: newDescription,
                position: 1,
                label: label,
                due_date: dueDate
            };
            console.log("payload is", payload);

            if (selectedTask) {
                await axios.patch(
                    `http://127.0.0.1:8000/kanban/${id_table}/${currentColumnId}/ticket/${selectedTask.id}/`,
                    payload,
                    { headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json", "Content-Type": "application/json" } }
                );
            } else {
                await axios.post(
                    `http://127.0.0.1:8000/kanban/${id_table}/${currentColumnId}/ticket/`,
                    {
                        name: newTitle,
                        description: newDescription,
                        position: 1},
                    { headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json", "Content-Type": "application/json" } }
                );
            }

            fetchData();
        } catch (error) {
            console.error("Error saving ticket:", error);
        }

        closePopup();
    };


    const deleteTicket = async () => {
        const token = localStorage.getItem('token');
        if (selectedTask) {
            try {
                await axios.delete(
                    `http://127.0.0.1:8000/kanban/${id_table}/${currentColumnId}/ticket/${selectedTask.id}/`,
                    { headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json", "Content-Type": "application/json" } }
                );
                fetchData();
            } catch (error) {
                console.error("Error deleting ticket:", error);
            }
        }
        closePopup();
    };

    const setLabel = async (ticketId, newLabel) => {
        if (!newLabel) return;
        const token = localStorage.getItem('token');
        try {
            console.log(`Updating ticket ${ticketId} with label ${newLabel}`);

            await axios.patch(
                `http://127.0.0.1:8000/kanban/${id_table}/${currentColumnId}/ticket/${ticketId}/`,
                { label: newLabel },
                { headers: { "Authorization": `Bearer ${token}` } }
            );

            fetchData();
        } catch (error) {
            console.error("Error updating label:", error);
        }
    };


    const setNewDueDate = async (ticketId, newDueDate) => {
        const token = localStorage.getItem('token');
        console.log("date is:", newDueDate, "for id ", ticketId);
        try {
            await axios.patch(
                `http://127.0.0.1:8000/kanban/${id_table}/${currentColumnId}/ticket/${selectedTask.id}/`,
                { due_date: formatDateForDisplay(newDueDate) },
                { headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json", "Content-Type": "application/json" } }
            );

            fetchData();
        } catch (error) {
            console.error("Error updating due date:", error);
        }
    };

    const formatDateForInput = (date) => {
        if (!date) return "";

        if (typeof date === "object" && date instanceof Date) {
            return date.toISOString().split("T")[0];
        }

        if (typeof date !== "string") return "";

        const parts = date.split("-");
        if (parts.length !== 3) return "";

        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    };

    const formatDateForDisplay = (date) => {
        if (!date) return "";

        if (typeof date === "object" && date instanceof Date) {
            const isoString = date.toISOString().split("T")[0];
            return formatDateForDisplay(isoString);
        }

        if (typeof date !== "string") return "";

        const parts = date.split("-");
        if (parts.length !== 3) return "";
        console.log("formatted date is:", date);
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    };



    const startEditingList = (listId, title) => {
        setIsEditingList(true);
        setEditListTitle(title);
        setListBeingEdited(listId);
    };

    const saveListTitle = async (listId) => {
        const token = localStorage.getItem('token');
        try {
            const payload = {
                name: editListTitle,
                list_id: listId,
            };

            await axios.patch(
                `http://127.0.0.1:8000/kanban/${id_table}/list/`,
                payload,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    }
                }
            );
            fetchData();
            setIsEditingList(false);
            setEditListTitle('');
            setListBeingEdited(null);
        } catch (error) {
            console.error("Error saving list title:", error);
        }
    };

    const handleDragEnd = async (result) => {
        const { source, destination, draggableId, type } = result;
        if (!destination) return;

        const token = localStorage.getItem("token");

        if (type === "column") {
            const updatedColumns = [...data.columns];

            const [movedColumn] = updatedColumns.splice(source.index, 1);
            updatedColumns.splice(destination.index, 0, movedColumn);

            updatedColumns.forEach((column, index) => {
                column.position = index + 1;
            });

            setData({ columns: updatedColumns });

            try {
                await axios.patch(
                    `http://127.0.0.1:8000/kanban/${id_table}/update/`,
                    { columns: updatedColumns.map(col => ({ id: col.id, position: col.position })) },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/json",
                            "Content-Type": "application/json",
                        },
                    }
                );

                console.log("List updated");
                fetchData();
            } catch (error) {
                console.error("Error when updating list:", error);
            }

            return;
        }

        const oldListId = source.droppableId;
        const newListId = destination.droppableId;
        const taskId = draggableId;

        const updatedColumns = [...data.columns];
        const sourceColumn = updatedColumns.find(col => col.id === oldListId);
        const destColumn = updatedColumns.find(col => col.id === newListId);

        if (!sourceColumn || !destColumn) return;

        console.log("drag", result);

        let movedTask;

        if (oldListId === newListId) {
            const reorderedTasks = [...sourceColumn.tasks];
            movedTask = reorderedTasks.splice(source.index, 1)[0];
            reorderedTasks.splice(destination.index, 0, movedTask);

            reorderedTasks.forEach((task, index) => {
                task.position = index + 1;
            });

            sourceColumn.tasks = reorderedTasks;
        } else {
            movedTask = sourceColumn.tasks.splice(source.index, 1)[0];
            destColumn.tasks.splice(destination.index, 0, movedTask);

            sourceColumn.tasks.forEach((task, index) => {
                task.position = index + 1;
            });

            destColumn.tasks.forEach((task, index) => {
                task.position = index + 1;
            });

            movedTask.list_id = newListId;
        }

        setData({ columns: updatedColumns });

        try {
            await axios.patch(
                `http://127.0.0.1:8000/kanban/${id_table}/${oldListId}/ticket/${taskId}/`,
                {
                    list_id: newListId,
                    position: destination.index + 1
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log("Ticket updated");

            await axios.patch(
                `http://127.0.0.1:8000/kanban/list/${newListId}/reorder/`,
                {
                    tickets: destColumn.tasks.map(task => ({
                        id: task.id,
                        position: task.position,
                    })),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log("Tickets reordered");
            fetchData();
        } catch (error) {
            console.error("Error when updating ticket:", error);
        }
    };

    return (
        <div>
            <Header />
            <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <button className="toggle-button" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? 'Close' : 'Open'}
                </button>
                <div className="board-list">
                    <h3> Your Boards</h3>
                    <ul>
                        {userBoards.map((board) => (
                            <li key={board.id}>
                                <Link
                                    to={`/board/${board.id}`}
                                    className="board-button">
                                    {board.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className={`main-content ${sidebarOpen ? 'shifted' : ''}`}>
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="board-container">
                        <Droppable droppableId="board" type="column" direction="horizontal">
                            {(provided) => (
                                <div className="kanban-container" ref={provided.innerRef} {...provided.droppableProps}>
                                    {data.columns.map((column, colIndex) => (
                                        <Draggable key={column.id} draggableId={column.id} index={colIndex}>
                                            {(provided) => (
                                                <div className="column" ref={provided.innerRef} {...provided.draggableProps}>
                                                    <div className="column-title" {...provided.dragHandleProps}>
                                                        {isEditingList && listBeingEdited === column.id ? (
                                                            <input
                                                                type="text"
                                                                value={editListTitle}
                                                                onChange={(e) => setEditListTitle(e.target.value)}
                                                                onBlur={() => saveListTitle(column.id)}
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <span onClick={() => startEditingList(column.id, column.title)}>
                                                    {column.title}
                                                </span>
                                                        )}
                                                        <button className="delete-list-button" onClick={() => confirmDeleteList(column.id)}>
                                                            ✖
                                                        </button>
                                                    </div>
                                                    <Droppable droppableId={column.id} type="task">
                                                        {(provided) => (
                                                            <div className="task-list" ref={provided.innerRef} {...provided.droppableProps}>
                                                                {column.tasks.map((task, taskIndex) => (
                                                                    <Draggable key={task.id} draggableId={task.id.toString()} index={taskIndex}>
                                                                        {(provided, snapshot) => (
                                                                            <div
                                                                                className="task"
                                                                                ref={provided.innerRef}
                                                                                {...provided.draggableProps}
                                                                                {...provided.dragHandleProps}
                                                                                onClick={() => openPopup(task, column.id)}
                                                                                style={{
                                                                                    background: task.label === null ? "#7c7cdc" : getLabelColor(task),
                                                                                    ...provided.draggableProps.style,
                                                                                    opacity: snapshot.isDragging ? 0.8 : 1,
                                                                                    cursor: "grab"
                                                                                }}
                                                                            >
                                                                                {task.text}
                                                                            </div>
                                                                        )}
                                                                    </Draggable>
                                                                ))}
                                                                {provided.placeholder}
                                                                <button className="add-task-button" onClick={() => openPopup(null, column.id)}>
                                                                    + Add Task
                                                                </button>
                                                            </div>
                                                        )}
                                                    </Droppable>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}

                                    <div className="add-list-container">
                                        <button className="add-list-button" onClick={() => setIsListPopupOpen(true)}>
                                            + Add List
                                        </button>
                                    </div>
                                </div>
                            )}
                        </Droppable>
                    </div>
                </DragDropContext>
            </div>

            {isListPopupOpen && (
                <div className="popup">
                    <div className="popup-content rectangle">
                        <h3>Add List</h3>
                        <div className="popup-body">
                            <div className="form-group">
                                <label>Title:</label>
                                <input
                                    type="text"
                                    value={newListTitle}
                                    onChange={(e) => setNewListTitle(e.target.value)}
                                    className="popup-input"
                                />
                            </div>
                        </div>
                        <div className="popup-footer">
                            <button onClick={addTable} className="save-button">Add</button>
                            <button onClick={closePopup} className="cancel-button">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {isDeletePopupOpen && (
                <div className="popup">
                    <div className="popup-content rectangle">
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete this list?</p>
                        <div className="popup-footer">
                            <button onClick={deleteList} className="save-button">Yes, Delete</button>
                            <button onClick={() => setIsDeletePopupOpen(false)} className="cancel-button">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {isPopupOpen && (
                <div className="popup">
                    <div className="popup-content rectangle">
                        <h3>{selectedTask ? 'Edit Task' : 'Add Task'}</h3>
                        <div className="popup-body">
                            <div className="form-group">
                                <label>Title:</label>
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="popup-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Description:</label>
                                <textarea
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    className="popup-textarea"
                                />
                            </div>
                            {selectedTask && (
                                <div className="form-group">
                                    <strong>Due Date: </strong>
                                    {selectedTask.due_date ? formatDateForDisplay(selectedTask.due_date) : "No deadline"}
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setNewDueDate(selectedTask.id, formatDateForDisplay(e.target.value))}
                                        className="popup-input"
                                    />
                                </div>
                            )}

                            {/* Label section */}
                            <div className={`form-group ${!selectedTask ? 'hidden' : ''}`}>
                                <label>Label:</label>
                                <select
                                    value={label}
                                    onChange={(e) => {
                                        const newLabel = e.target.value;
                                        setLabel(selectedTask ? selectedTask.id : null, newLabel);
                                    }}
                                    className="popup-select"
                                >
                                    <option value="">Colors</option>
                                    <option value="default">Default</option>
                                    <option value="yellow">🟡 Yellow</option>
                                    <option value="orange">🟠 Orange</option>
                                    <option value="red">🔴 Red</option>
                                    <option value="purple">🟣 Purple</option>
                                </select>
                            </div>
                        </div>
                        <div className="popup-footer">
                            <button onClick={saveChanges} className="save-button">{selectedTask ? 'Save' : 'Add'}</button>
                            <button onClick={closePopup} className="cancel-button">Cancel</button>
                            {selectedTask && (
                                <button onClick={deleteTicket} className="delete-button">Delete</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default BoardPage;