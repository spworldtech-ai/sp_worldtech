# SP WorldTech update — compact chat and attachments

- Reduced floating chat button and panel dimensions.
- Adjusted desktop header spacing and Join Free icon visibility while preserving the logo.
- Added attachment selection and message display to the existing chat widget.
- Backend stores attachment metadata/data in the existing MongoDB Message document, limited to 2 MB and allowlisted MIME types.
- Chat currently refreshes by authenticated polling; Socket.IO event infrastructure exists but this change does not claim full websocket subscription delivery.

Test deployment with authenticated user, staff, and admin accounts before production. Large files should use object storage rather than MongoDB document payloads.
