import { Card, ProgressBar, Alert, ListGroup } from "react-bootstrap";

/**
 * Component that displays current availability of computation instances and storage
 * @param {Object} availability - Object containing instances and storage availability data
 */
function CurrentAvailability({ availability }) {
    return (
        <>
            <h3 className="mb-3">
                <i className="bi bi-server me-2"></i>
                Current Availability
            </h3>

            {/* Computation Instances */}
            <Card className="shadow-sm mb-3">
                <Card.Header className="bg-primary text-white">
                    <h4 className="mb-0">
                        <i className="bi bi-cpu me-2"></i>
                        Computation Instances
                    </h4>
                </Card.Header>
                <Card.Body>
                    <ListGroup variant="flush" className="mb-2">
                        <ListGroup.Item>
                            <strong>Total:</strong> {availability.instances.total}
                        </ListGroup.Item>
                        <ListGroup.Item>
                            <strong>Used:</strong> {availability.instances.used}
                        </ListGroup.Item>
                        <ListGroup.Item>
                            <strong className={availability.instances.available === 0 ? 'text-danger' : 'text-success'}>
                                Available:
                            </strong> {availability.instances.available}
                        </ListGroup.Item>
                    </ListGroup>
                    <ProgressBar
                        now={(availability.instances.used / availability.instances.total) * 100}
                        variant={availability.instances.available === 0 ? 'danger' : availability.instances.available <= 1 ? 'warning' : 'success'}
                        label={`${availability.instances.used}/${availability.instances.total}`}
                    />
                    {availability.instances.available === 0 && (
                        <Alert variant="warning" className="mt-2 mb-0 py-1">
                            <small>No instances available</small>
                        </Alert>
                    )}
                </Card.Body>
            </Card>

            {/* Storage Capacity */}
            <Card className="shadow-sm">
                <Card.Header className="bg-success text-white">
                    <h4 className="mb-0">
                        <i className="bi bi-hdd me-2"></i>
                        Storage Capacity
                    </h4>
                </Card.Header>
                <Card.Body>
                    <ListGroup variant="flush" className="mb-2">
                        <ListGroup.Item>
                            <strong>Total:</strong> {availability.storage.total} TB
                        </ListGroup.Item>
                        <ListGroup.Item>
                            <strong>Used:</strong> {availability.storage.used} TB
                        </ListGroup.Item>
                        <ListGroup.Item>
                            <strong className={availability.storage.available === 0 ? 'text-danger' : 'text-success'}>
                                Available:
                            </strong> {availability.storage.available} TB
                        </ListGroup.Item>
                    </ListGroup>
                    <ProgressBar
                        now={(availability.storage.used / availability.storage.total) * 100}
                        variant={availability.storage.available === 0 ? 'danger' : availability.storage.available <= 10 ? 'warning' : 'success'}
                        label={`${availability.storage.used}/${availability.storage.total} TB`}
                    />
                    {availability.storage.available === 0 && (
                        <Alert variant="warning" className="mt-2 mb-0 py-1">
                            <small>No storage available</small>
                        </Alert>
                    )}
                </Card.Body>
            </Card>
        </>
    );
}

export { CurrentAvailability };
