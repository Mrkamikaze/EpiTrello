import React, { useState } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import axios from "axios";

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showPopup, setShowPopup] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [lateTasks, setLateTasks] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const { id_table } = useParams();
    const [currentDate, setCurrentDate] = useState(new Date());

    const fetchLateTasks = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get(`http://127.0.0.1:8000/kanban/list/${id_table}/`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
            });

            const now = new Date();
            now.setHours(0, 0, 0, 0);

            const overdueTasks = [];
            const allTasksList = [];

            response.data.forEach(list => {
                if (!list.tasks || !Array.isArray(list.tasks)) return;

                list.tasks.forEach(task => {
                    if (!task.due_date) return;

                    const dueDate = new Date(task.due_date);
                    allTasksList.push({ ...task, dueDate });

                    if (dueDate < now) {
                        overdueTasks.push({ ...task, dueDate });
                    }
                });
            });

            setLateTasks(overdueTasks);
            setAllTasks(allTasksList);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }
    };

    const changeMonth = (direction) => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(prevDate.getMonth() + direction);
            return newDate;
        });
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
        window.location.reload();
    };

    const generateCalendarDays = () => {
        const daysInMonth = [];
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const dayOfWeek = firstDayOfMonth.getDay();

        for (let i = 0; i < dayOfWeek; i++) {
            daysInMonth.push(null);
        }

        for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
            daysInMonth.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
        }

        return daysInMonth;
    };

    return (
        <header style={styles.header}>
            <Link to="/" style={styles.link}>EpiTrello</Link>
            <nav style={styles.nav}>
                {location.pathname.includes('/board') && (
                    <button
                        onClick={() => {
                            fetchLateTasks();
                            setShowPopup(true);
                        }}
                        style={styles.catchUpButton}
                    >
                        Catch up
                    </button>
                )}
                <button onClick={handleLogout} style={styles.logoutButton}>Disconnection</button>
            </nav>

            {showPopup && (
                <div style={styles.popupOverlay} onClick={() => setShowPopup(false)}>
                    <div style={styles.popup} onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setShowCalendar(true)}
                            style={styles.calendarButton}
                        >
                            Calendar
                        </button>

                        <h2>Late Tasks</h2>
                        <p>Today is: <strong>{new Date().toLocaleDateString()}</strong></p>

                        {lateTasks.length > 0 ? (
                            <ul style={styles.taskList}>
                                {lateTasks.map(task => (
                                    <li key={task.id} style={styles.taskItem}>
                                        <strong>{task.text}</strong> - Due: {task.dueDate.toLocaleDateString()}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No overdue tasks!</p>
                        )}

                        <button
                            onClick={() => setShowPopup(false)}
                            style={styles.closeButton}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {showCalendar && (
                <div style={styles.popupOverlay} onClick={() => setShowCalendar(false)}>
                    <div style={styles.popup} onClick={(e) => e.stopPropagation()}>
                        <h2>Task Calendar</h2>

                        <div style={styles.calendar}>
                            <div style={styles.calendarHeader}>
                                <button onClick={() => changeMonth(-1)} style={styles.navButton}>Previous</button>
                                <h1><span>{currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</span></h1>
                                <button onClick={() => changeMonth(1)} style={styles.navButton}>Next</button>
                            </div>

                            <div style={styles.calendarWeekdays}>
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                                    <div key={index} style={styles.calendarDayHeader}>
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div style={styles.calendarGrid}>
                                {generateCalendarDays().map((date, index) => (
                                    <div key={index} style={styles.calendarDay}>
                                        {date ? (
                                            <div>
                                                <span>{date.getDate()}</span>
                                                <div style={styles.taskIndicators}>
                                                    {allTasks
                                                        .filter(task => task.dueDate.toDateString() === date.toDateString())
                                                        .map(task => {
                                                            const isLate = task.dueDate < new Date();
                                                            return (
                                                                <div
                                                                    key={task.id}
                                                                    style={isLate ? { ...styles.taskIndicator, backgroundColor: '#e74c3c' } : styles.taskIndicator}
                                                                >
                                                                    {task.text}
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            </div>
                                        ) : (
                                            <span></span>
                                        )}
                                    </div>
                                ))}
                            </div>

                        </div>

                        <button
                            onClick={() => setShowCalendar(false)}
                            style={styles.closeButton}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
};

const styles = {
    header: {
        position: 'fixed',
        backgroundColor: '#fff',
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        width: '98%',
    },
    link: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#0079bf',
        textDecoration: 'none',
    },
    nav: {
        display: 'flex',
        gap: '15px',
    },
    catchUpButton: {
        backgroundColor: '#f39c12',
        color: '#fff',
        border: 'none',
        padding: '5px 10px',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    logoutButton: {
        backgroundColor: '#e74c3c',
        color: '#fff',
        border: 'none',
        padding: '5px 10px',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    popupOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    popup: {
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    },
    closeButton: {
        backgroundColor: '#e74c3c',
        color: '#fff',
        border: 'none',
        padding: '5px 10px',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    taskList: {
        listStyleType: 'none',
        padding: 0,
    },
    taskItem: {
        backgroundColor: '#f8d7da',
        padding: '10px',
        margin: '5px 0',
        borderRadius: '5px',
    },
    calendarButton: {
        position: "relative",
        left: "350px",
        background: "#f44336",
        border: "none",
        fontSize: "14px",
        cursor: "pointer"
    },
    calendar: {
        marginTop: '10px',
    },
    calendarHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    navButton: {
        backgroundColor: '#0079bf',
        color: '#fff',
        border: 'none',
        padding: '5px 10px',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    calendarWeekdays: {
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: '5px',
    },

    calendarDayHeader: {
        padding: '5px 0',
        backgroundColor: '#f0f0f0',
        borderBottom: '1px solid #ccc',
    },

    calendarGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gridGap: '10px',
    },
    calendarDay: {
        textAlign: 'center',
        padding: '10px',
        backgroundColor: '#f4f4f4',
        borderRadius: '5px',
        position: 'relative',
    },
    taskIndicators: {
        marginTop: '5px',
    },
    taskIndicator: {
        backgroundColor: '#0079bf',
        color: '#fff',
        fontSize: '15px',
        borderRadius: '10px',
        padding: '4px',
        wordWrap: 'break-word',
        whiteSpace: 'normal',
        maxWidth: '150px',
        textOverflow: 'ellipsis',
    },
};

export default Header;
