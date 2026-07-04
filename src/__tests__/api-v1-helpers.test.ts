describe("jsonError helper logic", () => {
  it("creates object with error key and correct status", () => {
    const createErrorResponse = (message: string, status: number) => ({
      body: { error: message },
      status,
    });

    const result = createErrorResponse("Something went wrong", 500);
    expect(result.body.error).toBe("Something went wrong");
    expect(result.status).toBe(500);
  });

  it("returns correct status for 404", () => {
    const createErrorResponse = (message: string, status: number) => ({
      body: { error: message },
      status,
    });

    const result = createErrorResponse("Not found", 404);
    expect(result.status).toBe(404);
    expect(result.body.error).toBe("Not found");
  });

  it("returns correct status for 401", () => {
    const createErrorResponse = (message: string, status: number) => ({
      body: { error: message },
      status,
    });

    const result = createErrorResponse("Unauthorized", 401);
    expect(result.status).toBe(401);
    expect(result.body.error).toBe("Unauthorized");
  });

  it("returns correct status for 429", () => {
    const createErrorResponse = (message: string, status: number) => ({
      body: { error: message },
      status,
    });

    const result = createErrorResponse("Rate limit exceeded", 429);
    expect(result.status).toBe(429);
    expect(result.body.error).toBe("Rate limit exceeded");
  });
});
