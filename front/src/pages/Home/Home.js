import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../Header';
import './Home.css';
import BoardPage from "../Boards/Boards";

const Home = () => {
    const [username, setUsername] = useState(null);
    const navigate = useNavigate();
    const ping = "http://127.0.0.1:8000/ping/";
    const tables_request = "http://127.0.0.1:8000/kanban/table/"
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isSignup, setIsSignup] = useState(false);
    const [boards, setBoards] = useState([]);
    const [hoveredBoard, setHoveredBoard] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedBoard, setSelectedBoard] = useState(null);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        username: "",
        first_name: "",
        last_name: ""
    });
    const [newBoardName, setNewBoardName] = useState('');
    const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
    const [boardPreview, setBoardPreview] = useState(null);

    axios.defaults.xsrfCookieName = "csrftoken";
    axios.defaults.xsrfHeaderName = "X-CSRFToken";

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
            fetchBoards(token);
            fetchUsername(token);
        }
    }, []);

    const fetchBoards = async (token) => {
        try {
            const response = await axios.get(tables_request, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
            });
            setBoards(response.data);
        } catch (error) {
            console.error("Error when fetching tables:", error.response);
        }
    };

    const fetchUsername = async (token) => {
        try {
            const response = await axios.get("http://localhost:8000/username/", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
            });
            setUsername(response.data.username);
        } catch (error) {
            console.error("Error when fetching tables:", error.response);
        }
    };

    const handleNewBoard = () => {
        setShowCreateBoardModal(true);
    };

    const createBoard = async () => {
        const token = localStorage.getItem('token');
        try {
            await axios.post(tables_request, { name: newBoardName }, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                }
            });
            setNewBoardName('');
            setShowCreateBoardModal(false);
            fetchBoards(token);
        } catch (error) {
            console.error("Error creating board:", error.response);
        }
    };

    const deleteBoard = async () => {
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://127.0.0.1:8000/kanban/${selectedBoard.id}/`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                }
            });
            setShowDeleteModal(false);
            fetchBoards(token);
        } catch (error) {
            console.error("Error deleting board:", error.response);
        }
    };

    const confirmDeleteBoard = (board) => {
        setSelectedBoard(board);
        setShowDeleteModal(true);
    };



    if (!isAuthenticated) {
        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <h2>{isSignup ? "Create account" : "Login"}</h2>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const url = isSignup ? 'http://127.0.0.1:8000/register/' : 'http://127.0.0.1:8000/login/';

                        axios.post(url, formData, {
                            headers: { 'Content-Type': 'application/json' },
                        })
                            .then(response => {
                                console.log("Server response:", response.data);

                                if (response.data.token) {
                                    localStorage.setItem('token', response.data.token);
                                    setIsAuthenticated(true);
                                    fetchBoards(response.data.token);

                                    setIsSignup(false);
                                }
                            })
                            .catch(error => console.error("Error:", error.response));
                    }}>
                        {isSignup && (
                            <>
                                <input type="text" name="username" placeholder="Username" onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                                <input type="text" name="first_name" placeholder="First name" onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required />
                                <input type="text" name="last_name" placeholder="Last name" onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required />
                            </>
                        )}
                        <input type="email" name="email" placeholder="Email" onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                        <input type="password" name="password" placeholder="Password" onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                        {isSignup ? (
                            <div className="note">
                                password requirement : 10 characters, 1 upper and lower case character, 1 special character
                            </div>) : ''}
                        <button type="submit">{isSignup ? "Sign up" : "Login"}</button>
                    </form>
                    <button className="toggle-auth" onClick={() => setIsSignup(!isSignup)}>
                        {isSignup ? "Already have an account? Log in" : "No account? Create one!"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Header />
            <div className="home-container">
                <main className="home-main">
                    <h2>{username ? `Welcome ${username} !` : "Please reconnect"}</h2>
                    <h2>Your Boards</h2>
                    <div className="boards-grid">
                        {boards.length > 0 ? boards.map((board) => (
                            <div key={board.id}
                                 className="board-card"
                                 onMouseEnter={() => setHoveredBoard(board.id)}
                                 onMouseLeave={() => setHoveredBoard(null)}>
                                <Link to={`/board/${board.id}`} className="board-link">
                                    {board.name}
                                </Link>
                                {hoveredBoard === board.id && (
                                    <button className="delete-board-button" onClick={() => confirmDeleteBoard(board)}>
                                        ✖
                                    </button>
                                )}
                            </div>
                        )) : <p>No boards available</p>}
                    </div>
                </main>

                <footer className="home-footer">
                    <button className="new-board-button" onClick={handleNewBoard}>
                        + New Board
                    </button>
                </footer>
            </div>
            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Are you sure you want to delete this board?</h2>
                        <p><strong>Board Name:</strong> {selectedBoard.name}</p>
                        <button onClick={deleteBoard} className="delete-button">Yes, Delete</button>
                        <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {showCreateBoardModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Create a New Board</h2>
                        <input
                            type="text"
                            placeholder="Board name"
                            value={newBoardName}
                            onChange={(e) => setNewBoardName(e.target.value)}
                            required
                        />
                        <button onClick={createBoard}>Create Board</button>
                        <button onClick={() => setShowCreateBoardModal(false)}>Cancel</button>
                    </div>
                </div>

            )}
        </div>

    );
};

export default Home;
