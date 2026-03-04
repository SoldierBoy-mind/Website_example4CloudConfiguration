import { Card, Button, Alert, Spinner, Row, Col, Container } from "react-bootstrap";

/**
 * Component that displays order summary with total cost and submit button
 * @param {Object} user - Current logged in user
 * @param {number} ramInstance - Selected RAM instance
 * @param {Object} ramInstancePrices - Object mapping RAM sizes to prices
 * @param {number} storagePrice - Calculated storage price
 * @param {number} dataTransferPrice - Calculated data transfer price
 * @param {number} total - Total monthly cost
 * @param {Function} canSubmitOrder - Function to check if order can be submitted
 * @param {Function} handleSubmitOrder - Handler for order submission
 * @param {boolean} submitting - Flag indicating if order is being submitted
 * @param {Object} availability - Availability data for validation messages
 * @param {number} storageCapacity - Selected storage capacity for validation
 */
function OrderSummary({
    user,
    ramInstance,
    ramInstancePrices,
    storagePrice,
    dataTransferPrice,
    total,
    canSubmitOrder,
    handleSubmitOrder,
    submitting,
    availability,
    storageCapacity
}) {
    return (
        <>
            <h3 className="mb-3">
                <i className="bi bi-receipt me-2"></i>
                Order Summary
            </h3>
            <Card className="shadow-lg border-0">
                <Card.Body className="p-4">
                    <Container className="mb-3 px-0">
                        <Row className="mb-2">
                            <Col className="text-muted">Computation Instance:</Col>
                            <Col xs="auto"><strong>€{ramInstance ? ramInstancePrices[ramInstance] : 0}/month</strong></Col>
                        </Row>
                        <Row className="mb-2">
                            <Col className="text-muted">Storage Capacity:</Col>
                            <Col xs="auto"><strong>€{storagePrice}/month</strong></Col>
                        </Row>
                        <Row className="mb-3">
                            <Col className="text-muted">Data Transfer:</Col>
                            <Col xs="auto"><strong>€{dataTransferPrice.toFixed(2)}/month</strong></Col>
                        </Row>
                        <hr />
                        <Row className="mb-4 align-items-center">
                            <Col><h4 className="mb-0">Total Monthly Cost:</h4></Col>
                            <Col xs="auto">
                                <h3 className="mb-0 text-primary">
                                    <strong>€{total.toFixed(2)}</strong>
                                </h3>
                            </Col>
                        </Row>
                    </Container>
                    <Container className="text-center px-0">
                        {user ? (
                            <>
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={handleSubmitOrder}
                                    disabled={!canSubmitOrder() || submitting}
                                    className="w-100"
                                >
                                    {submitting ? (
                                        <>
                                            <Spinner as="span" animation="border" size="sm" className="me-2" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-circle me-2"></i>
                                            Submit Order
                                        </>
                                    )}
                                </Button>
                                {!canSubmitOrder() && (
                                    <Alert variant="warning" className="mt-3 mb-0 small">
                                        <i className="bi bi-exclamation-triangle me-1"></i>
                                        {availability.instances.available <= 0 && "No instances available"}
                                        {availability.instances.available > 0 && ramInstance === 0 && "Please select a computation instance"}
                                        {ramInstance !== 0 && storageCapacity > availability.storage.available && "Not enough storage available"}
                                    </Alert>
                                )}
                            </>
                        ) : (
                            <>
                                <p className="text-muted mb-3">Please login to submit your order</p>
                                <Button variant="outline-primary" size="lg" disabled className="w-100">
                                    <i className="bi bi-lock me-2"></i>
                                    Login Required
                                </Button>
                            </>
                        )}
                    </Container>
                </Card.Body>
            </Card>
        </>
    );
}

export { OrderSummary };
