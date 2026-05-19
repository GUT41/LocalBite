const express = require('express');
const restaurantController = require('../controllers/restaurantController');
const recommendationController = require('../controllers/recommendationController');
const { authOptional, authRequired } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

const router = express.Router();

router.use(authOptional);

router.get('/nearby', restaurantController.nearby);
router.get('/search', restaurantController.search);
router.get('/featured', restaurantController.featured);
router.get('/recommendations', recommendationController.recommendations);
router.get('/details/:placeId', restaurantController.details);
router.get('/:restaurantId/menus', restaurantController.menus);

router.post('/', authRequired, requireAdmin, restaurantController.createManual);
router.put('/menus', authRequired, requireAdmin, restaurantController.updateMenu);

module.exports = router;
