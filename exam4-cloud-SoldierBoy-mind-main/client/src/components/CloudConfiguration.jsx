import { Card, Form, Alert, Row, Col } from "react-bootstrap";

/**
 * Component for configuring cloud service parameters (RAM, Storage, Data Transfer)
 * @param {Object} user - Current logged in user
 * @param {Object} config - Configuration object with prices and limits
 * @param {Object} availability - Availability data for instances and storage
 * @param {number} ramInstance - Selected RAM instance
 * @param {Function} handleRamChange - Handler for RAM selection change
 * @param {number} storageCapacity - Selected storage capacity in TB
 * @param {Function} setStorageCapacity - Setter for storage capacity
 * @param {number} dataTransfer - Selected data transfer in GB
 * @param {Function} setDataTransfer - Setter for data transfer
 * @param {Function} getMinStorage - Function to get minimum storage based on RAM
 * @param {Function} handleIntegerKeyDown - Handler to block non-integer input
 * @param {Function} calculateDataTransferPrice - Function to calculate data transfer price
 */
function CloudConfiguration({
    user,
    config,
    availability,
    ramInstance,
    handleRamChange,
    storageCapacity,
    setStorageCapacity,
    dataTransfer,
    setDataTransfer,
    getMinStorage,
    handleIntegerKeyDown,
    calculateDataTransferPrice
}) {
    const dataTransferPrice = calculateDataTransferPrice(dataTransfer);

    return (
        <>
            <h3 className="mb-3">
                <i className="bi bi-gear-fill me-2"></i>
                Configure Your Cloud Service
            </h3>
            {!user && (
                <Alert variant="info" className="mb-3">
                    <i className="bi bi-info-circle me-2"></i>
                    Please <strong>login</strong> to create an order
                </Alert>
            )}

            {/* RAM Configuration Card */}
            <Card className="shadow-sm mb-3">
                <Card.Header className="bg-primary text-white">
                    <i className="bi bi-cpu me-2"></i>
                    <strong>Computation Instance</strong>
                </Card.Header>
                <Card.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Select RAM Size</Form.Label>
                        <Form.Select
                            value={ramInstance}
                            onChange={(e) => handleRamChange(Number(e.target.value))}
                            disabled={!user || availability.instances.available === 0}
                            className="mb-2"
                        >
                            <option value={0}>Select RAM...</option>
                            <option value={16}>16 GB - €{config.price_ram_16}/month</option>
                            <option value={32}>32 GB - €{config.price_ram_32}/month</option>
                            <option value={128}>128 GB - €{config.price_ram_128}/month</option>
                        </Form.Select>
                        {ramInstance === 32 && (
                            <Alert variant="warning" className="py-2 px-3 mb-0 small">
                                <i className="bi bi-exclamation-triangle me-1"></i>
                                Requires min. {config.min_storage_ram_32} TB storage
                            </Alert>
                        )}
                        {ramInstance === 128 && (
                            <Alert variant="warning" className="py-2 px-3 mb-0 small">
                                <i className="bi bi-exclamation-triangle me-1"></i>
                                Requires min. {config.min_storage_ram_128} TB storage
                            </Alert>
                        )}
                    </Form.Group>
                    <Row className="border-top pt-3 align-items-center">
                        <Col className="text-muted">Monthly Price:</Col>
                        <Col xs="auto">
                            <h5 className="mb-0 text-primary">
                                €{ramInstance ? (ramInstance === 16 ? config.price_ram_16 : ramInstance === 32 ? config.price_ram_32 : config.price_ram_128) : 0}
                            </h5>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Storage Configuration Card */}
            <Card className="shadow-sm mb-3">
                <Card.Header className="bg-success text-white">
                    <i className="bi bi-hdd me-2"></i>
                    <strong>Storage Capacity</strong>
                </Card.Header>
                <Card.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Terabytes (TB)</Form.Label>
                        <Form.Control
                            type="number"
                            min={getMinStorage(ramInstance)}
                            max={availability.storage.available}
                            step={1}
                            value={storageCapacity || ""}
                            onChange={(e) => {
                                const value = Math.max(
                                    getMinStorage(ramInstance),
                                    Math.min(
                                        availability.storage.available,
                                        Math.floor(Number(e.target.value) || getMinStorage(ramInstance))
                                    )
                                );
                                setStorageCapacity(value);
                            }}
                            onKeyDown={handleIntegerKeyDown}
                            disabled={!user}
                        />
                        <Form.Text className="text-muted">
                            Min: {getMinStorage(ramInstance)} TB | Max: {availability.storage.available} TB
                        </Form.Text>
                        {storageCapacity > availability.storage.available && (
                            <Alert variant="danger" className="py-2 px-3 mt-2 mb-0 small">
                                <i className="bi bi-x-circle me-1"></i>
                                Not enough storage available
                            </Alert>
                        )}
                    </Form.Group>
                    <Row className="border-top pt-3 align-items-center">
                        <Col className="text-muted">Monthly Price:</Col>
                        <Col xs="auto">
                            <h5 className="mb-0 text-success">€{storageCapacity * config.price_storage_tb}</h5>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Data Transfer Configuration Card */}
            <Card className="shadow-sm">
                <Card.Header className="bg-warning text-dark">
                    <i className="bi bi-arrow-left-right me-2"></i>
                    <strong>Data Transfer</strong>
                </Card.Header>
                <Card.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Gigabytes (GB)</Form.Label>
                        <Form.Control
                            type="number"
                            min={10}
                            step={1}
                            value={dataTransfer || ""}
                            onChange={(e) =>
                                setDataTransfer(Math.max(10, Math.floor(Number(e.target.value) || 10)))
                            }
                            onKeyDown={handleIntegerKeyDown}
                            disabled={!user}
                        />
                        <Form.Text className="text-muted">
                            <i className="bi bi-info-circle me-1"></i>
                            Base: {config.transfer_base_gb} GB included
                        </Form.Text>
                    </Form.Group>
                    <Row className="border-top pt-3 align-items-center">
                        <Col className="text-muted">Monthly Price:</Col>
                        <Col xs="auto">
                            <h5 className="mb-0 text-warning">€{dataTransferPrice.toFixed(2)}</h5>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </>
    );
}

export { CloudConfiguration };
