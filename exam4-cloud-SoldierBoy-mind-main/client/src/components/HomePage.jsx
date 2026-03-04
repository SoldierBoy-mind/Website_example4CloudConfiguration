
import { useState, useEffect } from "react";
import { Col, Container, Row, Alert } from "react-bootstrap";

import { API } from '../API.jsx';
import { CurrentAvailability } from './CurrentAvailability.jsx';
import { CloudConfiguration } from './CloudConfiguration.jsx';
import { OrderSummary } from './OrderSummary.jsx';

import 'bootstrap-icons/font/bootstrap-icons.css';

// HomePage component - main page for configuring and ordering cloud services
function HomePage({ user }) {
    // State for configuration and availability loaded from server
    const [config, setConfig] = useState(null);
    const [availability, setAvailability] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // State for order configuration
    const [ramInstance, setRamInstance] = useState(0);
    const [storageCapacity, setStorageCapacity] = useState(1);
    const [dataTransfer, setDataTransfer] = useState(10);

    // Load configuration and availability on component mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const [configData, availabilityData] = await Promise.all([
                    API.fetchConfiguration(),
                    API.fetchAvailability()
                ]);
                setConfig(configData);
                setAvailability(availabilityData);
            } catch (err) {
                setError('Failed to load data from server');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) {
        return <Container className="text-center mt-4"><h4>Loading...</h4></Container>;
    }

    if (error) {
        return <Container className="mt-4"><Alert variant="danger">{error}</Alert></Container>;
    }

    // Prices from configuration
    const ramInstancePrices = {
        16: config.price_ram_16,
        32: config.price_ram_32,
        128: config.price_ram_128
    };

    const storagePrice = storageCapacity * config.price_storage_tb;

    // Function to get minimum storage based on RAM selection
    const getMinStorage = (ram) => {
        if (ram === 32) return config.min_storage_ram_32;
        if (ram === 128) return config.min_storage_ram_128;
        return 1; // minimum is always 1 TB
    };

    // Function to handle RAM change and adjust storage if below minimum
    const handleRamChange = (value) => {
        setRamInstance(value);
        const minStorage = getMinStorage(value);
        if (storageCapacity < minStorage) {
            setStorageCapacity(minStorage);
        }
    };

    // Function to calculate data transfer price
    const calculateDataTransferPrice = (gb) => {
        if (gb <= config.transfer_base_gb) {
            return config.price_transfer_base;
        }

        const extraGB = gb - config.transfer_base_gb;
        let price = config.price_transfer_base;

        if (gb <= config.transfer_threshold_1) {
            // Up to 1000 GB: 80% discount
            price += (extraGB / 10) * config.price_transfer_base * config.transfer_discount_1;
        } else {
            // First part up to 1000 GB
            const firstPartGB = config.transfer_threshold_1 - config.transfer_base_gb;
            price += (firstPartGB / 10) * config.price_transfer_base * config.transfer_discount_1;

            // Remaining part beyond 1000 GB: 50% discount
            const secondPartGB = gb - config.transfer_threshold_1;
            price += (secondPartGB / 10) * config.price_transfer_base * config.transfer_discount_2;
        }

        return price;
    };

    const dataTransferPrice = calculateDataTransferPrice(dataTransfer);

    // Total monthly cost
    const total =
        (ramInstance ? ramInstancePrices[ramInstance] : 0) +
        storagePrice +
        dataTransferPrice;

    // Function to allow only arrow keys for incrementing/decrementing values
    const handleIntegerKeyDown = (e) => {
        const allowedKeys = ["ArrowUp", "ArrowDown", "Tab"];

        if (!allowedKeys.includes(e.key)) {
            e.preventDefault();
        }
    };

    // Validation function
    const canSubmitOrder = () => {
        if (!user) return false; // Must be authenticated
        if (ramInstance === 0) return false; // Must select an instance
        if (availability.instances.available <= 0) return false; // No instances available
        if (storageCapacity > availability.storage.available) return false; // Not enough storage
        return true;
    };

    // Function to handle order submission
    const handleSubmitOrder = async () => {
        // Clear any previous messages
        setError('');
        setSuccessMessage('');
        setSubmitting(true);

        try {
            // Submit the order to the server (prices are calculated server-side)
            const newOrder = await API.createOrder(
                ramInstance,
                storageCapacity,
                dataTransfer
            );

            // Show success message
            setSuccessMessage(`Order successfully created! Order ID: ${newOrder.id}`);

            // Reload availability to reflect the new order
            const updatedAvailability = await API.fetchAvailability();
            setAvailability(updatedAvailability);

            // Reset form to default values
            setRamInstance(0);
            setStorageCapacity(1);
            setDataTransfer(10);
        } catch (err) {
            // Show error message
            const errorMsg = Array.isArray(err) ? err.join(', ') : 'Failed to create order';
            setError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container fluid style={{ paddingLeft: "2rem", paddingRight: "2rem", paddingBottom: "1rem" }}>
           
            {/* Success/Error Messages */}
            {successMessage && (
                <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>
                    {successMessage}
                </Alert>
            )}
            {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            <Row className="g-4 align-items-start">
                {/* Left Column - Current Availability */}
                <Col>
                    <CurrentAvailability availability={availability} />
                </Col>

                {/* Center Column - Configuration Section */}
                <Col>
                    <CloudConfiguration
                        user={user}
                        config={config}
                        availability={availability}
                        ramInstance={ramInstance}
                        handleRamChange={handleRamChange}
                        storageCapacity={storageCapacity}
                        setStorageCapacity={setStorageCapacity}
                        dataTransfer={dataTransfer}
                        setDataTransfer={setDataTransfer}
                        getMinStorage={getMinStorage}
                        handleIntegerKeyDown={handleIntegerKeyDown}
                        calculateDataTransferPrice={calculateDataTransferPrice}
                    />
                </Col>

                {/* Right Column - Order Summary */}
                <Col>
                    <OrderSummary
                        user={user}
                        ramInstance={ramInstance}
                        ramInstancePrices={ramInstancePrices}
                        storagePrice={storagePrice}
                        dataTransferPrice={dataTransferPrice}
                        total={total}
                        canSubmitOrder={canSubmitOrder}
                        handleSubmitOrder={handleSubmitOrder}
                        submitting={submitting}
                        availability={availability}
                        storageCapacity={storageCapacity}
                    />
                </Col>
            </Row>
        </Container>
    );
}

export { HomePage };
