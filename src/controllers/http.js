// Controllers translate HTTP inputs into service calls. Services own business rules.
export const respond =
  (operation, status = 200) =>
  async (req, res, next) => {
    try {
      const data = await operation(req);
      res.status(status).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };
