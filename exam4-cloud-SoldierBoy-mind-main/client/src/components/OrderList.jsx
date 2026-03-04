import { useState, useEffect } from "react";
import { Container, Card, Alert, Spinner, Table, Button } from "react-bootstrap";

import { API } from '../API.jsx';

/**
 * OrderList component - displays all past orders for the logged-in user
 * Shows an immutable view of each order with the same information from the configurator
 * @param {Object} user - The logged-in user object with isTotp flag
 */
function OrderList({ user }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState(null); // Track which order is being deleted

    // Load user orders 
    useEffect(() => {
        const loadOrders = async () => {
            try {
                const userOrders = await API.fetchUserOrders();
                setOrders(userOrders);
                setLoading(false);
            } catch (err) {
                setError(Array.isArray(err) ? err.join(', ') : 'Failed to load orders');
                setLoading(false);
            }
        };

        loadOrders();
    }, []);

    // Handle order deletion
    const handleDelete = async (orderId) => {
        setDeleting(orderId);
        try {
            await API.deleteOrder(orderId);
            // Remove the deleted order from the list
            setOrders(orders.filter(order => order.id !== orderId));
            setError(''); // Clear any previous errors
        } catch (err) {
            setError(Array.isArray(err) ? err.join(', ') : 'Failed to delete order');
        } finally {
            setDeleting(null);
        }
    };

    // Show loading spinner while fetching data
    if (loading) {
        return (
            <Container fluid style={{ paddingLeft: "2rem", paddingRight: "2rem", paddingBottom: "1rem" }} className="text-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Container>
        );
    }

    // Show error message if fetch failed
    if (error) {
        return (
            <Container fluid style={{ paddingLeft: "2rem", paddingRight: "2rem", paddingBottom: "1rem" }}>
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container fluid style={{ paddingLeft: "2rem", paddingRight: "2rem", paddingBottom: "1rem", maxWidth: "1200px" }}>
            <h2 className="mb-4 text-center">
                <i className="bi bi-box-seam me-2"></i>
                My Orders
            </h2>

            {/* Show warning if user hasn't authenticated with 2FA */}
            {!user?.isTotp && (
                <Alert variant="warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    <strong>Limited access:</strong> You are not authenticated with 2FA.
                    To delete orders, please log out and log in again with TOTP authentication.
                </Alert>
            )}

            {/* Show message if no orders exist */}
            {orders.length === 0 ? (
                <Alert variant="info">
                    <i className="bi bi-info-circle me-2"></i>
                    You have no orders yet. Go to the configuration page to create your first order!
                </Alert>
            ) : (
                <Card className="shadow-sm">
                    <Card.Header className="bg-primary text-white">
                        <h5 className="mb-0">
                            <i className="bi bi-list-ul me-2"></i>
                            Order History ({orders.length} {orders.length === 1 ? 'order' : 'orders'})
                        </h5>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <Table hover className="mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="text-center" style={{ paddingLeft: '8px' }}>
                                        RAM
                                    </th>
                                    <th className="text-center" style={{ paddingLeft: '8px' }}>
                                        Storage
                                    </th>
                                    <th className="text-center" style={{ paddingLeft: '8px' }}>
                                        Data Transfer
                                    </th>
                                    <th className="text-center" style={{ paddingLeft: '8px' }}>
                                        Total/Month
                                    </th>
                                    {/* Show Actions column only if user has TOTP */}
                                    {user?.isTotp && (
                                        <th className="text-center">
                                            Actions
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id}>
                                        <td className="text-center align-middle">
                                            <strong className="text-primary">{order.ram_gb} GB</strong>
                                            <br />
                                            <small className="text-muted">€{order.ram_price.toFixed(2)}/month</small>
                                        </td>
                                        <td className="text-center align-middle">
                                            <strong className="text-success">{order.storage_tb} TB</strong>
                                            <br />
                                            <small className="text-muted">€{order.storage_price.toFixed(2)}/month</small>
                                        </td>
                                        <td className="text-center align-middle">
                                            <strong className="text-warning">{order.data_transfer_gb} GB</strong>
                                            <br />
                                            <small className="text-muted">€{order.transfer_price.toFixed(2)}/month</small>
                                        </td>
                                        <td className="text-center align-middle">
                                            <strong className="text-primary fs-6">
                                                €{order.price_per_month.toFixed(2)}
                                            </strong>
                                        </td>
                                        {/* Show Delete button only if user has TOTP */}
                                        {user?.isTotp && (
                                            <td className="text-center align-middle">
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleDelete(order.id)}
                                                    disabled={deleting === order.id}
                                                >
                                                    {deleting === order.id ? (
                                                        <>
                                                            <Spinner
                                                                as="span"
                                                                animation="border"
                                                                size="sm"
                                                                role="status"
                                                                aria-hidden="true"
                                                                className="me-1"
                                                            />
                                                            Deleting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="bi bi-trash me-1"></i>
                                                            Delete
                                                        </>
                                                    )}
                                                </Button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card.Body>
                    <Card.Footer className="text-muted bg-light">
                        <small>
                            <i className="bi bi-info-circle me-1"></i>
                            Total orders: {orders.length} |
                            Total monthly cost: <strong>€{orders.reduce((sum, order) => sum + order.price_per_month, 0).toFixed(2)}</strong>
                        </small>
                    </Card.Footer>
                </Card>
            )}
        </Container>
    );
}

export { OrderList };
