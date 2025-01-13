# IDP GraphQL API Platform

## Overview
The **IDP GraphQL API Platform** is an open-source web-based tool designed for managing and querying Identity Protection data locally and securely. The platform is built with advanced security measures to ensure all operations remain confined to the user's local browser environment.

### Key Features:
- Completely local execution: No data is sent outside the browser.
- External communication is limited to loading third-party content via CDNs and retrieving the external IP address for API policy validation.
- Secure, flexible architecture with modular components for managing Identity Protection data.
- Extensible support for local proxies to avoid CORS issues.

![image](https://github.com/user-attachments/assets/c726cac6-bfdb-49ac-b671-9ee76c57b2aa)

![image](https://github.com/user-attachments/assets/4e225c8b-a9b1-470a-bd1c-571560541883)

![image](https://github.com/user-attachments/assets/d1006469-90eb-4d9d-9ade-46752134951e)

![image](https://github.com/user-attachments/assets/8b4ba393-996a-43cb-bdfc-c39d7a5cc5cf)

![image](https://github.com/user-attachments/assets/718314ff-0a21-4015-b15f-6e221980fd2d)

---

## Security Features
- **Local Execution:** All data and operations are managed within the user's browser. No sensitive information is transmitted to external servers.
- **CDN Content Loading:**
  - **Tailwind CSS**: Provides styling for the platform's interface.
  - **DataTables**: Enables interactive and feature-rich tables.
  - **Font Awesome**: Supplies icons for a professional and intuitive UI.
  - **jQuery**: Facilitates dynamic interactions in the web interface.
- **External IP Fetching**: The platform only makes a single external API call to `https://api.ipify.org` to retrieve the user's external IP address, used for validating API access policies.
- **Proxy Configuration:** A Python-based local proxy is included to avoid CORS restrictions when interacting with APIs.

---

## Local Proxy Configuration
The platform uses a Python-based proxy to handle API requests securely and avoid CORS issues.

### Setting up the Proxy
1. Ensure you have Python installed on your system.
2. Install the required libraries:
   ```bash
   pip install flask flask-cors
   ```
3. Run the local proxy server:
   ```bash
   python proxy.py
   ```
4. The proxy server will start at `http://localhost:8000`.

### Updating the Proxy
To use a different proxy, update the `PROXY_URL` variable in the JavaScript code to point to the new proxy server.

---

## API Permissions
To use this platform effectively, ensure the following API permissions are granted:
- **Identity Protection Entities:** Read Permission.
- **Identity Protection GraphQL:** Write Permission.
- **Identity Protection Timeline:** Read Permission.

---

## Deployment Instructions
1. Clone this repository:
   ```bash
   git clone https://github.com/hawk1811/CS_IDP_GQL_API.git
   ```
2. Open the `index.html` file in your browser.
3. Ensure the local proxy is running before executing any API queries.

---

## License
This project is licensed under the MIT License. See the LICENSE file for details.

