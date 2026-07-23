const getSession = (req, res) => {
    res.json({ sessionId: req.sessionId });
};

export { getSession };
