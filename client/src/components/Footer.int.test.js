import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Footer from "./Footer";

describe("Footer Integration Tests", () => {
    it("renders all links and navigates correctly", async () => {
        render(
            <MemoryRouter initialEntries={["/"]}>
                <Footer /> {/* stays visible on all routes */}
                <Routes>
                    <Route path="/" element={<div>Home Page</div>} />
                    <Route path="/about" element={<div>About Page</div>} />
                    <Route path="/contact" element={<div>Contact Page</div>} />
                    <Route path="/policy" element={<div>Privacy Policy Page</div>} />
                </Routes>
            </MemoryRouter>
        );

        const links = screen.getAllByRole("link");
        const aboutLink = links.find(link => link.textContent === "About");
        const contactLink = links.find(link => link.textContent === "Contact");
        const policyLink = links.find(link => link.textContent === "Privacy Policy");

        expect(aboutLink).toBeInTheDocument();
        expect(contactLink).toBeInTheDocument();
        expect(policyLink).toBeInTheDocument();

        await userEvent.click(aboutLink);
        await waitFor(() => {
            expect(screen.getByText("About Page")).toBeInTheDocument();
        });

        expect(aboutLink).toBeInTheDocument();
        expect(contactLink).toBeInTheDocument();
        expect(policyLink).toBeInTheDocument();

        await userEvent.click(contactLink);
        await waitFor(() => {
            expect(screen.getByText("Contact Page")).toBeInTheDocument();
        });

        expect(aboutLink).toBeInTheDocument();
        expect(contactLink).toBeInTheDocument();
        expect(policyLink).toBeInTheDocument();

        await userEvent.click(policyLink);
        await waitFor(() => {
            expect(screen.getByText("Privacy Policy Page")).toBeInTheDocument();
        });
    });

    it("renders footer text correctly", () => {
        render(
            <MemoryRouter>
                <Footer />
            </MemoryRouter>
        );

        expect(
            screen.getByText(/All Rights Reserved © TestingComp/i)
        ).toBeInTheDocument();
    });
});
