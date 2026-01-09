// Async handler wrapper to catch errors in async route handlers
// Eliminates need for try-catch in every controller

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
