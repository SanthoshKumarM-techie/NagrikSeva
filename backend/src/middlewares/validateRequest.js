export function validateRequest(schema) {
  return async (req, res, next) => {
    try {
      if (typeof schema.parseAsync === 'function') {
        const parsed = await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params
        });
        if (parsed.body !== undefined) req.body = parsed.body;
        if (parsed.query !== undefined) req.query = parsed.query;
        if (parsed.params !== undefined) req.params = parsed.params;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

export default validateRequest;
