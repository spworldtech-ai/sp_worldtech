const router = require('express').Router();
const { register, userSignup, login, userPasswordLogin, staffLogin, staffSignup, createOperationsPin, operationsPinLogin, googleLogin } = require('../controllers/authController');

router.post('/register', register);
router.post('/signup', userSignup);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/user-login', userPasswordLogin);
router.post('/staff-signup', staffSignup);
router.post('/staff-login', staffLogin);
router.post('/operations-pin/create', createOperationsPin);
router.post('/operations-pin/login', operationsPinLogin);

module.exports = router;
