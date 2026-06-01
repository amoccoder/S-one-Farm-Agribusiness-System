/**
 * Event System Architecture for S-ONE FARM ERP
 * Enables clean service-to-service communication via events
 */

const EventEmitter = require('events');

/**
 * Event types and their schemas
 */
const EventTypes = {
  // Livestock Events
  LIVESTOCK_CREATED: 'livestock.created',
  LIVESTOCK_UPDATED: 'livestock.updated',
  LIVESTOCK_DELETED: 'livestock.deleted',
  LIVESTOCK_FEED_CONSUMED: 'livestock.feed_consumed',
  LIVESTOCK_HEALTH_RECORDED: 'livestock.health_recorded',

  // Inventory Events
  INVENTORY_ITEM_CREATED: 'inventory.item_created',
  INVENTORY_ITEM_UPDATED: 'inventory.item_updated',
  INVENTORY_STOCK_UPDATED: 'inventory.stock_updated',
  INVENTORY_STOCK_DEDUCTED: 'inventory.stock_deducted',
  INVENTORY_LOW_STOCK_ALERT: 'inventory.low_stock_alert',

  // Finance Events
  EXPENSE_RECORDED: 'finance.expense_recorded',
  SALE_RECORDED: 'finance.sale_recorded',
  PURCHASE_ORDER_CREATED: 'finance.purchase_order_created',
  PURCHASE_ORDER_COMPLETED: 'finance.purchase_order_completed',
  FINANCIAL_REPORT_GENERATED: 'finance.report_generated',

  // Farm Events
  FARM_CREATED: 'farm.created',
  FARM_UPDATED: 'farm.updated',
  FARM_DELETED: 'farm.deleted',
  FIELD_CREATED: 'farm.field_created',
  FIELD_UPDATED: 'farm.field_updated',

  // Crop Events
  CROP_CREATED: 'crop.created',
  CROP_UPDATED: 'crop.updated',
  PLANTING_CREATED: 'crop.planting_created',
  PLANTING_UPDATED: 'crop.planting_updated',
  HARVEST_RECORDED: 'crop.harvest_recorded',

  // Analytics Events
  ANALYTICS_DATA_UPDATED: 'analytics.data_updated',
  DASHBOARD_REFRESHED: 'analytics.dashboard_refreshed',

  // IoT Events
  IOT_DATA_RECEIVED: 'iot.data_received',
  IOT_ALERT_TRIGGERED: 'iot.alert_triggered',

  // Auth Events
  USER_REGISTERED: 'auth.user_registered',
  USER_LOGGED_IN: 'auth.user_logged_in',
  USER_LOGGED_OUT: 'auth.user_logged_out',
};

/**
 * Event Bus - Central event dispatcher
 */
class EventBus extends EventEmitter {
  constructor() {
    super();
    this.eventHistory = [];
    this.maxHistorySize = 1000;
  }

  /**
   * Emit an event
   */
  emit(eventType, data) {
    const event = {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
      id: `${eventType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    // Store in history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    console.log(`[Event] ${eventType}:`, data);

    // Emit to listeners
    super.emit(eventType, event);
    super.emit('*', event); // Wildcard listener
  }

  /**
   * Subscribe to event
   */
  on(eventType, handler) {
    super.on(eventType, handler);
  }

  /**
   * Subscribe to event once
   */
  once(eventType, handler) {
    super.once(eventType, handler);
  }

  /**
   * Unsubscribe from event
   */
  off(eventType, handler) {
    super.off(eventType, handler);
  }

  /**
   * Get event history
   */
  getHistory(eventType = null, limit = 100) {
    let history = this.eventHistory;

    if (eventType) {
      history = history.filter((e) => e.type === eventType);
    }

    return history.slice(-limit);
  }

  /**
   * Clear event history
   */
  clearHistory() {
    this.eventHistory = [];
  }

  /**
   * Get event statistics
   */
  getStats() {
    const stats = {};

    this.eventHistory.forEach((event) => {
      if (!stats[event.type]) {
        stats[event.type] = 0;
      }
      stats[event.type]++;
    });

    return stats;
  }
}

/**
 * Event Handlers - Service-specific event handlers
 */
class EventHandlers {
  constructor(eventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Register all event handlers
   */
  registerAll() {
    // Livestock event handlers
    this.eventBus.on(EventTypes.LIVESTOCK_FEED_CONSUMED, (event) => {
      this.handleFeedConsumed(event);
    });

    this.eventBus.on(EventTypes.LIVESTOCK_HEALTH_RECORDED, (event) => {
      this.handleHealthRecorded(event);
    });

    // Inventory event handlers
    this.eventBus.on(EventTypes.INVENTORY_STOCK_DEDUCTED, (event) => {
      this.handleStockDeducted(event);
    });

    this.eventBus.on(EventTypes.INVENTORY_LOW_STOCK_ALERT, (event) => {
      this.handleLowStockAlert(event);
    });

    // Finance event handlers
    this.eventBus.on(EventTypes.EXPENSE_RECORDED, (event) => {
      this.handleExpenseRecorded(event);
    });

    this.eventBus.on(EventTypes.SALE_RECORDED, (event) => {
      this.handleSaleRecorded(event);
    });

    // Analytics event handlers
    this.eventBus.on(EventTypes.LIVESTOCK_FEED_CONSUMED, (event) => {
      this.updateAnalytics(event);
    });

    this.eventBus.on(EventTypes.INVENTORY_STOCK_DEDUCTED, (event) => {
      this.updateAnalytics(event);
    });

    this.eventBus.on(EventTypes.EXPENSE_RECORDED, (event) => {
      this.updateAnalytics(event);
    });

    console.log('Event handlers registered');
  }

  /**
   * Handle feed consumed event
   */
  handleFeedConsumed(event) {
    console.log('[Handler] Feed consumed:', event.data);
    // Update inventory
    // Update analytics
    // Log audit
  }

  /**
   * Handle health recorded event
   */
  handleHealthRecorded(event) {
    console.log('[Handler] Health recorded:', event.data);
    // Update analytics
    // Send notification if critical
    // Log audit
  }

  /**
   * Handle stock deducted event
   */
  handleStockDeducted(event) {
    console.log('[Handler] Stock deducted:', event.data);
    // Check low stock threshold
    // Update analytics
    // Log audit
  }

  /**
   * Handle low stock alert event
   */
  handleLowStockAlert(event) {
    console.log('[Handler] Low stock alert:', event.data);
    // Send notification
    // Create alert
    // Log audit
  }

  /**
   * Handle expense recorded event
   */
  handleExpenseRecorded(event) {
    console.log('[Handler] Expense recorded:', event.data);
    // Update financial reports
    // Update analytics
    // Log audit
  }

  /**
   * Handle sale recorded event
   */
  handleSaleRecorded(event) {
    console.log('[Handler] Sale recorded:', event.data);
    // Update financial reports
    // Update analytics
    // Log audit
  }

  /**
   * Update analytics on event
   */
  updateAnalytics(event) {
    console.log('[Handler] Updating analytics for:', event.type);
    // Trigger analytics update
    // Invalidate cache
    // Queue analytics job
  }
}

/**
 * Event Publisher - Helper to publish events
 */
class EventPublisher {
  constructor(eventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Publish livestock feed consumed event
   */
  publishFeedConsumed(livestockId, quantity, unit) {
    this.eventBus.emit(EventTypes.LIVESTOCK_FEED_CONSUMED, {
      livestockId,
      quantity,
      unit,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Publish inventory stock deducted event
   */
  publishStockDeducted(itemId, quantity, reason) {
    this.eventBus.emit(EventTypes.INVENTORY_STOCK_DEDUCTED, {
      itemId,
      quantity,
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Publish expense recorded event
   */
  publishExpenseRecorded(amount, category, description) {
    this.eventBus.emit(EventTypes.EXPENSE_RECORDED, {
      amount,
      category,
      description,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Publish sale recorded event
   */
  publishSaleRecorded(amount, items, description) {
    this.eventBus.emit(EventTypes.SALE_RECORDED, {
      amount,
      items,
      description,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Publish livestock health recorded event
   */
  publishHealthRecorded(livestockId, eventType, description) {
    this.eventBus.emit(EventTypes.LIVESTOCK_HEALTH_RECORDED, {
      livestockId,
      eventType,
      description,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Publish low stock alert event
   */
  publishLowStockAlert(itemId, currentStock, threshold) {
    this.eventBus.emit(EventTypes.INVENTORY_LOW_STOCK_ALERT, {
      itemId,
      currentStock,
      threshold,
      timestamp: new Date().toISOString(),
    });
  }
}

// Create singleton instances
const eventBus = new EventBus();
const eventHandlers = new EventHandlers(eventBus);
const eventPublisher = new EventPublisher(eventBus);

module.exports = {
  EventTypes,
  EventBus,
  EventHandlers,
  EventPublisher,
  eventBus,
  eventHandlers,
  eventPublisher,
};
