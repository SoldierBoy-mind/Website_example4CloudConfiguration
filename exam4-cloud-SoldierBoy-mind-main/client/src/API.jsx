const SERVER_HOST = "http://localhost";
const SERVER_PORT = 3001;

const SERVER_BASE = `${SERVER_HOST}:${SERVER_PORT}/api/`;

/**
 * Generic API call
 *
 * @param endpoint API endpoint string to fetch
 * @param method HTTP method
 * @param body HTTP request body string
 * @param headers additional HTTP headers to be passed to 'fetch'
 * @param expectResponse wheter to expect a non-empty response body
 *
 * @returns whatever the specified API endpoint returns
 */
//It construct and send the request
const APICall = async (endpoint, method = "GET", body = undefined, headers = undefined, expectResponse = true) => {
  let errors = [];

  try {
    const response = await fetch(new URL(endpoint, SERVER_BASE), {
        method,
        body,
        headers,
        credentials: "include"
    });

    if (response.ok) {
      if (expectResponse) {
        return await response.json();
      }
      return; // No response expected, return undefined
    }
    else {
      try {
        const parsedResponse = await response.json();
        errors = parsedResponse.errors;
      } catch {
        errors = ["Authorization error"];  // Generic, no properly formatted json in the server response
      }
    }
  } catch {
    const err = ["Failed to contact the server"];
    throw err;
  }

  if (errors.length !== 0)
    throw errors;
};


/**
 * Fetches the currently logged in user's info
 */
const fetchCurrentUser = async () => await APICall("sessions/current");

/**
 * Fetches all configuration parameters (prices, limits, etc.)
 * PUBLIC - no authentication required
 */
const fetchConfiguration = async () => await APICall("configuration");

/**
 * Fetches current resource availability (instances and storage)
 * PUBLIC - no authentication required
 */
const fetchAvailability = async () => await APICall("availability");

/**
 * Fetches all orders for the logged-in user
 * REQUIRES AUTHENTICATION
 */
const fetchUserOrders = async () => await APICall("orders");


/**
 * Attempts to login the user
 *
 * @param email email of the user
 * @param password password of the user
 */
const login = async (email, password) => await APICall(
  "sessions",
  "POST",
  JSON.stringify({username: email, password}),
  { "Content-Type": "application/json" }
);

/**
 * Logout.
 * This function can return a "Not authenticated" error if the user wasn't authenticated beforehand
 */
const logout = async () => await APICall(
  "sessions/current",
  "DELETE",
  undefined,
  undefined,
  false
);



/**
 * Creates a new order
 * REQUIRES AUTHENTICATION
 * Prices are calculated server-side for security
 * @param ramGb RAM in GB (16, 32, or 128)
 * @param storageTb storage in TB
 * @param dataTransferGb data transfer in GB
 */
const createOrder = async (ramGb, storageTb, dataTransferGb) => await APICall(
  "orders",
  "POST",
  JSON.stringify({
    ram_gb: ramGb,
    storage_tb: storageTb,
    data_transfer_gb: dataTransferGb
  }),
  { "Content-Type": "application/json" }
);


/**
 * Attempts to perform login-totp
 * 
 * @param code the TOTP code
 */
const loginTotp = async (code) => await APICall(
  "login-totp",
  "POST",
  JSON.stringify({code: code}),
  { "Content-Type": "application/json" }
);

/** * Deletes an order by its ID
 * REQUIRES AUTHENTICATION
 * @param orderId ID of the order to delete
 */
const deleteOrder = async (orderId) => await APICall(
  `orders/${orderId}`,
  "DELETE",
  undefined,
  undefined,
  false
);

const API = {
  login,
  logout,
  fetchCurrentUser,
  fetchConfiguration,
  fetchAvailability,
  fetchUserOrders,
  createOrder,
  deleteOrder,
  loginTotp
};

export { API };


