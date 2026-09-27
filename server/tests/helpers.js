// fake express request/response objects so controllers can be tested without a server
export function mockReq({ body = {}, params = {}, query = {} } = {}) {
    return { body, params, query, sessionId: "test-session" };
}

export function mockRes() {
    const res = { statusCode: null, body: null };
    res.status = (code) => {
        res.statusCode = code; return res;
    };

    res.json = (data) => {
        res.body = data; return res;
    };
    
    return res;
}

// captures whatever the controller passes to next()
export function mockNext() {
    const next = (err) => {
        next.error = err;
    };
    next.error = undefined;
    return next;
}

// a fake database connection that records what happened to the transaction
export function mockConnection(queryHandler) {
    const conn = { 
        committed: false,
        rolledBack: false,
        released: false,
        queries: []
    };

    conn.beginTransaction = async () => {};

    conn.commit = async () => { 
        conn.committed = true;
    };

    conn.rollback = async () => {
        conn.rolledBack = true;
    };

    conn.release = () => {
        conn.released = true;
    };
    conn.query = async (sql, params) => {
        conn.queries.push(sql);
        return queryHandler(sql, params);
    };
    return conn;
}
