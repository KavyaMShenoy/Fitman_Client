import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from "../utils/auth";
import { Form, Button, ListGroup, Spinner } from 'react-bootstrap';

import socket from "../utils/socket";

import { FaTrash } from 'react-icons/fa';
import "../css/Messenger.css";

const Messenger = ({ userId, trainerId }) => {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const [fetchError, setFetchError] = useState(null);
  const [socketError, setSocketError] = useState(null);
  const [criticalError, setCriticalError] = useState(null);

  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const showStatus = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage({ type: "", text: "" }), 3000);
  };

  const [isSending, setIsSending] = useState(false);
  const [deletingMsgId, setDeletingMsgId] = useState(null);


  useEffect(() => {
    if (socketError) {
      setCriticalError(socketError);
    } else if (fetchError) {
      setCriticalError(fetchError);
    } else {
      setCriticalError(null);
    }
  }, [socketError, fetchError]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axiosInstance.get(`/messages/${trainerId}`);
        setMessages(response.data.messages || []);
        setFetchError(null);
      } catch (error) {
        setFetchError("Failed to load messages. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
    socket.emit("join", userId);

    socket.on('newMessage', (newMessage) => {
      if (
        (newMessage.senderId === userId && newMessage.receiverId === trainerId) ||
        (newMessage.senderId === trainerId && newMessage.receiverId === userId)
      ) {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      }
    });

    socket.on("connect_error", (error) => {
      setSocketError("WebSocket connection failed. Trying to reconnect...");
    });


    return () => {
      socket.emit("leave", userId);
      socket.off("newMessage");
    };
  }, [userId, trainerId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSending(true);

    try {
      await axiosInstance.post("/messages/send", {
        senderId: userId,
        receiverId: trainerId,
        content
      });

      setContent('');
      showStatus("success", "Message sent!");

    } catch (error) {
      showStatus("error", "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const deleteMessage = async (messageId) => {
    setDeletingMsgId(messageId);
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      showStatus("success", "Message deleted");
    } catch (error) {
      showStatus("error", "Failed to delete message");
    } finally {
      setDeletingMsgId(null);
    }
  };

  return (
    <>
      {criticalError ? (
        <div className="d-flex justify-content-center align-items-center text-danger" style={{ height: '100%' }}>
          {criticalError}
        </div>
      ) :
        (<div className="d-flex flex-column flex-grow-1 overflow-hidden" style={{ height: '100%' }}>
          <div className="p-3 flex-grow-1 overflow-auto" style={{ maxHeight: '100%' }}>
            {isLoading ? (
              <div className="text-center"><Spinner animation="border" /></div>
            ) : (
              messages.length === 0 ? (
                <div className="d-flex justify-content-center align-items-center text-muted" style={{ height: '100%' }}>No messages yet. Start the conversation!</div>
              ) : (<ListGroup variant="flush">
                {messages.map((msg) => {
                  const isMine = msg.senderId === userId;
                  return (
                    <ListGroup.Item key={msg._id} className="border-0 px-0 w-100">
                      <div className={`d-flex ${isMine ? 'justify-content-end' : 'justify-content-start'}`}>
                        <div
                          className={`p-3 mb-2 chat-style`}
                          style={{
                            borderBottomLeftRadius: isMine ? '1.5rem' : '0.5rem',
                            borderBottomRightRadius: isMine ? '0.5rem' : '1.5rem',
                            background: isMine
                              ? 'linear-gradient(135deg, #4eac6d, #2e8b57)'
                              : 'linear-gradient(135deg,rgb(77, 114, 237),rgb(136, 134, 201))',
                          }}
                        >
                          <div className="fw-semibold mb-1" style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                            {isMine ? 'You' : 'Trainer'}
                          </div>

                          <div style={{
                            fontSize: '1rem',
                            lineHeight: '1.5',
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap',
                          }}>
                            {msg.content}
                          </div>

                          <div className="d-flex justify-content-between align-items-center mt-2" style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                            {isMine && (
                              <Button
                                variant="outline-light"
                                size="sm"
                                onClick={() => deleteMessage(msg._id)}
                                disabled={isSending || deletingMsgId === msg._id}
                                className="mx-2 d-flex align-items-center justify-content-center delete-btn"
                                style={{
                                  padding: '0.4rem 0.8rem',
                                  fontSize: '0.85rem',
                                  border: 'none',
                                  borderRadius: '1.5rem',
                                  background: 'linear-gradient(145deg, #ff4e4e, #c0392b)',
                                  color: '#fff',
                                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
                                  transition: 'all 0.3s ease-in-out',
                                }}
                              >
                                <FaTrash />
                              </Button>

                            )}
                          </div>
                        </div>

                      </div>
                    </ListGroup.Item>
                  );
                })}
                <div ref={messagesEndRef} />
              </ListGroup>)
            )
            }
          </div>

          <div className="bg-white p-3 rounded-bottom-4 shadow-sm">
            <Form onSubmit={sendMessage} className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder="Type your message..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="rounded-pill shadow-sm"
              />
              <Button type="submit" variant="primary" disabled={!content.trim() || isSending || deletingMsgId} className="rounded-pill px-4">
                Send
              </Button>
            </Form>
            {statusMessage.text && (
              <div
                className={`mt-2 text-center fw-semibold transition-opacity ${statusMessage.type === "success" ? "text-success" : "text-danger"
                  }`}
                style={{
                  fontSize: '0.85rem',
                  animation: 'fade-in-out 3s ease-in-out'
                }}
              >
                {statusMessage.text}
              </div>
            )}
          </div>
        </div>)
      }
    </>
  );
};

export default Messenger;