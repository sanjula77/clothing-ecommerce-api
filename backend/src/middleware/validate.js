// Validation middleware factory
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message).join(", ");
      return res.status(400).json({
        success: false,
        error: errors,
      });
    }

    // Replace req.body with validated and sanitized value
    req.body = value;
    next();
  };
};

// Validation middleware for query parameters
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message).join(", ");
      return res.status(400).json({
        success: false,
        error: errors,
      });
    }

    // In Express 5, req.query is read-only (has only a getter)
    // We can't replace it, but validation ensures the data is safe
    // Controllers can continue using req.query - it's already validated
    // Store validated/sanitized values in a custom property if needed
    req.validatedQuery = value;
    next();
  };
};

// Validation middleware for URL parameters
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message).join(", ");
      return res.status(400).json({
        success: false,
        error: errors,
      });
    }

    // Try to update params individually (safer than replacing entire object)
    // If params is read-only, store validated values separately
    try {
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          req.params[key] = value[key];
        }
      }
    } catch {
      // If params is read-only, store validated values separately
      req.validatedParams = value;
    }
    next();
  };
};
