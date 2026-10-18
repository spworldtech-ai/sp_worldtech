# SP WorldTech Robot Hero Consistency Update

- Updated the shared robot hero injector to recognize the site's different existing hero structures, including homepage, inner-page, service, Academy and dashboard heroes.
- The real supplied `spwt-robot.png` is used; image is rendered with `object-fit: contain` so the complete robot and chest logo remain visible.
- Added a full-width translucent hero band with responsive sizing and a clear Talk to the Robot action. Existing hero text and actions are not removed.
- Synced the shared robot CSS, JS and image between `frontend/assets` and `dist/assets`.
- Ensured HTML files in frontend and dist load the shared robot script once.
- Existing `.env` files were not edited.

## Verification
JavaScript syntax, HTML script coverage, source/dist asset equality and ZIP integrity should be checked before deployment. Browser visual QA and live API/role/payment regression tests remain necessary before production approval.
