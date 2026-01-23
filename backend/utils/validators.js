export const validateURL = (req, res, next) => {
  const { url } = req.body;

  try {
    new URL(url);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid URL",
    });
  }
};
