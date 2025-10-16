import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Register from "./Register";
import axios from "axios";
import toast from "react-hot-toast";


// Mocks used: axios (mock), useNavigate (stub via MemoryRouter + assertion), toast (fake implementation)
// 1. mocks, stubs, fakes used and how many:
//    - axios: 1 mock (jest.mock) -> communicaation based tests
//    - toast (react-hot-toast): 1 mock/fake (jest.fn()) -> communication based tests
//    - navigation: 1 stub via asserting location in MemoryRouter -> state/output based

jest.mock("axios", () => ({
  post: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  // Provide a no-op Toaster component used by Layout
  Toaster: () => null,
  // Default export used directly in Register for toast.success/error
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()])
}));

jest.mock('../../context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()])
}));

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));

jest.mock('../../components/Header', () => {
  return function MockedHeader() {
    return <div data-testid="mocked-header">Header</div>;
  };
});

describe("Register Component Integration", () => {
  const fillForm = () => {
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '12345678' } });
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '123 Street' } });
    fireEvent.change(screen.getByLabelText(/dob/i), { target: { value: '2000-01-01' } });
    fireEvent.change(screen.getByLabelText(/answer/i), { target: { value: 'Football' } });
  };

  const setup = () =>
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("successfully registers the user and navigates to /login", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    setup();

    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Wait for axios call and toast
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/register", {
        name: "John Doe",
        email: "test@example.com",
        password: "Password123!",
        phone: "12345678",
        address: "123 Street",
        DOB: "2000-01-01",
        answer: "Football",
      });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Registered Successfully, Please Login");
    });

    await waitFor(() => {
      expect(screen.getByText("Login Page")).toBeInTheDocument();
    });
  });

  it("shows API error toast when registration fails", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: false, message: "User already exists" } });
    setup();

    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("User already exists");
    });

    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("shows network/server error toast on axios failure", async () => {
    axios.post.mockRejectedValueOnce(new Error("Network Error"));
    setup();

    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });

    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("does not call API when form validation fails", async () => {
    setup();

    // Leave required fields empty
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "invalid-email" } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(axios.post).not.toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(toast.success).not.toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(toast.error).not.toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it("clears validation errors after correcting inputs", async () => {
    setup();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "invalid-email" } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
    // Correct the email
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } });
    fillForm();

    axios.post.mockResolvedValueOnce({ data: { success: true } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Registered Successfully, Please Login");
    });

    await waitFor(() => {
      expect(screen.getByText("Login Page")).toBeInTheDocument();
    });
  });

  it("handles boundary phone numbers correctly", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    setup();

    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: "12345678" } });
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/auth/register",
        expect.objectContaining({ phone: "12345678" })
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });

  });
});

// describe("Register integration", () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   test("shows required errors when submitting empty form", async () => {
//     // Technique: control flow testing (statement/branch coverage) - required field branches
//     // Type: state-based (DOM shows validation messages)
//     renderWithRouter(<Register />);

//     fireEvent.click(screen.getByRole("button", { name: /register/i }));

//     expect(await screen.findByText(/Name is required/i)).toBeInTheDocument();
//     expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
//     expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
//     expect(screen.getByText(/Phone number is required/i)).toBeInTheDocument();
//     expect(screen.getByText(/Address is required/i)).toBeInTheDocument();
//     expect(screen.getByText(/Date of Birth is required/i)).toBeInTheDocument();
//     expect(screen.getByText(/Security answer is required/i)).toBeInTheDocument();
//     expect(axios.post).not.toHaveBeenCalled();
//   });

//   test("invalid email and password patterns show errors", async () => {
//     // Technique: equivalence partitions (invalid email format class), boundary value analysis (password length/pattern)
//     // Type: state-based
//     renderWithRouter(<Register />);

//     await userEvent.type(screen.getByLabelText(/name/i), "John");
//     await userEvent.type(screen.getByLabelText(/email/i), "not-an-email");
//     await userEvent.type(screen.getByLabelText(/password/i), "abcde!1"); // 7 chars -> boundary just below 8
//     await userEvent.type(screen.getByLabelText(/phone/i), "1234567"); // 7 digits -> boundary below 8
//     await userEvent.type(screen.getByLabelText(/address/i), "Addr");
//     await userEvent.type(screen.getByLabelText(/dob/i), "2000-01-01");
//     await userEvent.type(screen.getByLabelText(/answer/i), "Cricket");

//     fireEvent.click(screen.getByRole("button", { name: /register/i }));

//     expect(await screen.findByText(/Invalid email format/i)).toBeInTheDocument();
//     expect(
//       screen.getByText(
//         /Password must be at least 8 characters, include 1 uppercase and 1 special character/i
//       )
//     ).toBeInTheDocument();
//     expect(screen.getByText(/Phone number must be 8–15 digits only/i)).toBeInTheDocument();
//     expect(axios.post).not.toHaveBeenCalled();
//   });

//   test("phone boundary valid at 8 and 15 digits", async () => {
//     // Technique: boundary value analysis (phone min=8, max=15), equivalence partitions (valid phone class)
//     // Type: output-based (no error messages)
//     renderWithRouter(<Register />);

//     // 8 digits
//     await userEvent.type(screen.getByLabelText(/name/i), "Jane");
//     await userEvent.type(screen.getByLabelText(/email/i), "jane@example.com");
//     await userEvent.type(screen.getByLabelText(/password/i), "Abcdefg!"); // 8 chars, 1 uppercase, 1 special
//     await userEvent.type(screen.getByLabelText(/phone/i), "12345678");
//     await userEvent.type(screen.getByLabelText(/address/i), "A1");
//     await userEvent.type(screen.getByLabelText(/dob/i), "2000-01-01");
//     await userEvent.type(screen.getByLabelText(/answer/i), "Ball");
//     fireEvent.click(screen.getByRole("button", { name: /register/i }));

//     // Should attempt API since no errors
//     await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));

//     // Reset for 15 digits case
//     jest.clearAllMocks();
//     renderWithRouter(<Register />);

//     await userEvent.type(screen.getByLabelText(/name/i), "Jane");
//     await userEvent.type(screen.getByLabelText(/email/i), "jane@example.com");
//     await userEvent.type(screen.getByLabelText(/password/i), "Abcdefg!");
//     await userEvent.type(screen.getByLabelText(/phone/i), "123456789012345");
//     await userEvent.type(screen.getByLabelText(/address/i), "A1");
//     await userEvent.type(screen.getByLabelText(/dob/i), "2000-01-01");
//     await userEvent.type(screen.getByLabelText(/answer/i), "Ball");
//     fireEvent.click(screen.getByRole("button", { name: /register/i }));

//     await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
//   });

//   test("successful submit calls API, shows success toast and navigates", async () => {
//     // Technique: control flow testing (success branch), decision table (API success -> toast.success + navigate)
//     // Type: communication-based (axios, toast), state-based (URL change)
//     axios.post.mockResolvedValueOnce({ data: { success: true } });
//     renderWithRouter(<Register />);

//     await userEvent.type(screen.getByLabelText(/name/i), "John");
//     await userEvent.type(screen.getByLabelText(/email/i), "john@example.com");
//     await userEvent.type(screen.getByLabelText(/password/i), "Abcdefg!");
//     await userEvent.type(screen.getByLabelText(/phone/i), "12345678");
//     await userEvent.type(screen.getByLabelText(/address/i), "Addr");
//     await userEvent.type(screen.getByLabelText(/dob/i), "2000-01-01");
//     await userEvent.type(screen.getByLabelText(/answer/i), "Cricket");

//     fireEvent.click(screen.getByRole("button", { name: /register/i }));

//     await waitFor(() => expect(axios.post).toHaveBeenCalledWith(
//       "/api/v1/auth/register",
//       expect.objectContaining({
//         name: "John",
//         email: "john@example.com",
//         password: "Abcdefg!",
//         phone: "12345678",
//         address: "Addr",
//         DOB: "2000-01-01",
//         answer: "Cricket",
//       })
//     ));

//     await waitFor(() => expect(toast.success).toHaveBeenCalled());

//     // navigation assertion via MemoryRouter reaching /login route
//     await waitFor(() => expect(screen.findBy(/LOGIN PAGE/i)).toBeInTheDocument());
//   });

//   test("API returns success=false shows error toast with server message", async () => {
//     // Technique: decision table (API failure: success=false -> toast.error with message)
//     // Type: communication-based (toast.error), control flow (else branch)
//     axios.post.mockResolvedValueOnce({ data: { success: false, message: "Email taken" } });
//     renderWithRouter(<Register />);

//     await userEvent.type(screen.getByLabelText(/name/i), "John");
//     await userEvent.type(screen.getByLabelText(/email/i), "john@example.com");
//     await userEvent.type(screen.getByLabelText(/password/i), "Abcdefg!");
//     await userEvent.type(screen.getByLabelText(/phone/i), "12345678");
//     await userEvent.type(screen.getByLabelText(/address/i), "Addr");
//     await userEvent.type(screen.getByLabelText(/dob/i), "2000-01-01");
//     await userEvent.type(screen.getByLabelText(/answer/i), "Cricket");

//     fireEvent.click(screen.getByRole("button", { name: /register/i }));

//     await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Email taken"));
//     expect(screen.queryByText(/LOGIN PAGE/i)).not.toBeInTheDocument();
//   });

//   test("API throws -> generic error toast", async () => {
//     // Technique: control flow testing (catch branch), decision table (exception -> toast.error generic)
//     // Type: communication-based
//     axios.post.mockRejectedValueOnce(new Error("network"));
//     renderWithRouter(<Register />);

//     await userEvent.type(screen.getByLabelText(/name/i), "John");
//     await userEvent.type(screen.getByLabelText(/email/i), "john@example.com");
//     await userEvent.type(screen.getByLabelText(/password/i), "Abcdefg!");
//     await userEvent.type(screen.getByLabelText(/phone/i), "12345678");
//     await userEvent.type(screen.getByLabelText(/address/i), "Addr");
//     await userEvent.type(screen.getByLabelText(/dob/i), "2000-01-01");
//     await userEvent.type(screen.getByLabelText(/answer/i), "Cricket");

//     fireEvent.click(screen.getByRole("button", { name: /register/i }));

//     await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Something went wrong"));
//     expect(screen.queryByText(/LOGIN PAGE/i)).not.toBeInTheDocument();
//   });
// });

// import React from "react";
// import { render, screen, fireEvent, waitFor } from "@testing-library/react";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import { rest } from "msw";
// import { setupServer } from "msw/node";
// import Register from "../../pages/Auth/Register";
// import Login from "../../pages/Auth/Login";

// const server = setupServer(
//   // Successful registration
//   rest.post("/api/v1/auth/register", (req, res, ctx) => {
//     return res(
//       ctx.status(200),
//       ctx.json({ success: true, message: "Registration successful" })
//     );
//   })
// );

// beforeAll(() => server.listen());
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close());

// describe("Register → Login integration", () => {
//   it("navigates to the Login page after successful registration", async () => {
//     render(
//       <BrowserRouter>
//         <Routes>
//           <Route path="/register" element={<Register />} />
//           <Route path="/login" element={<Login />} />
//         </Routes>
//       </BrowserRouter>
//     );

//     fireEvent.change(screen.getByLabelText(/name/i), {
//       target: { value: "John Doe" },
//     });
//     fireEvent.change(screen.getByLabelText(/email/i), {
//       target: { value: "test@example.com" },
//     });
//     fireEvent.change(screen.getByLabelText(/password/i), {
//       target: { value: "Password123!" },
//     });
//     fireEvent.change(screen.getByLabelText(/phone/i), {
//       target: { value: "12345678" },
//     });
//     fireEvent.change(screen.getByLabelText(/address/i), {
//       target: { value: "123 Street" },
//     });
//     fireEvent.change(screen.getByLabelText(/dob/i), {
//       target: { value: "2000-01-01" },
//     });
//     fireEvent.change(screen.getByLabelText(/answer/i), {
//       target: { value: "Football" },
//     });

//     fireEvent.click(screen.getByText(/register/i));

//     await waitFor(() => {
//       expect(screen.getByText(/login form/i)).toBeInTheDocument();
//     });
//   });

//   it("stays on Register and shows error on failed registration", async () => {
//     // Override handler for failed registration
//     server.use(
//       rest.post("/api/v1/auth/register", (req, res, ctx) => {
//         return res(
//           ctx.status(400),
//           ctx.json({ success: false, message: "Email already exists" })
//         );
//       })
//     );

//     render(
//       <BrowserRouter>
//         <Routes>
//           <Route path="/register" element={<Register />} />
//           <Route path="/login" element={<Login />} />
//         </Routes>
//       </BrowserRouter>
//     );

//     fireEvent.change(screen.getByLabelText(/name/i), {
//       target: { value: "Jane Doe" },
//     });
//     fireEvent.change(screen.getByLabelText(/email/i), {
//       target: { value: "duplicate@example.com" },
//     });
//     fireEvent.change(screen.getByLabelText(/password/i), {
//       target: { value: "Password123!" },
//     });
//     fireEvent.change(screen.getByLabelText(/phone/i), {
//       target: { value: "98765432" },
//     });
//     fireEvent.change(screen.getByLabelText(/address/i), {
//       target: { value: "456 Street" },
//     });
//     fireEvent.change(screen.getByLabelText(/dob/i), {
//       target: { value: "1999-05-10" },
//     });
//     fireEvent.change(screen.getByLabelText(/answer/i), {
//       target: { value: "Soccer" },
//     });

//     fireEvent.click(screen.getByText(/register/i));

//     await waitFor(() => {
//       expect(screen.getByText(/register/i)).toBeInTheDocument();
//     });
//   });
// });
