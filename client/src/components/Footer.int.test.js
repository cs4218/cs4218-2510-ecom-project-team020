import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Footer from "./Footer";

describe("Footer Integration Tests", () => {
    // it("renders all links and navigates correctly", async () => {
    //     render(
    //         <MemoryRouter initialEntries={["/"]}>
    //             <Routes>
    //                 <Route path="/" element={<Footer />} />
    //                 <Route path="/about" element={<div>About Page</div>} />
    //                 <Route path="/contact" element={<div>Contact Page</div>} />
    //                 <Route path="/policy" element={<div>Privacy Policy Page</div>} />
    //             </Routes>
    //         </MemoryRouter>
    //     );

    //     // Find links by textContent
    //     const links = screen.getAllByRole("link");
    //     const aboutLink = links.find(link => link.textContent === "About");
    //     const contactLink = links.find(link => link.textContent === "Contact");
    //     const policyLink = links.find(link => link.textContent === "Privacy Policy");

    //     expect(aboutLink).toBeInTheDocument();
    //     expect(contactLink).toBeInTheDocument();
    //     expect(policyLink).toBeInTheDocument();

    //     // Click links and verify navigation
    //     await userEvent.click(aboutLink);
    //     expect(await screen.findByText("About Page")).toBeInTheDocument();

    //     await userEvent.click(contactLink);
    //     expect(await screen.findByText("Contact Page")).toBeInTheDocument();

    //     await userEvent.click(policyLink);
    //     expect(await screen.findByText("Privacy Policy Page")).toBeInTheDocument();
    // });

    it("renders all links and navigates correctly", async () => {
    render(
        <MemoryRouter initialEntries={["/"]}>
            <Routes>
                <Route path="/" element={<Footer />} />
                <Route path="/about" element={<div>About Page</div>} />
                <Route path="/contact" element={<div>Contact Page</div>} />
                <Route path="/policy" element={<div>Privacy Policy Page</div>} />
            </Routes>
        </MemoryRouter>
    );

    // Find links by textContent
    const links = screen.getAllByRole("link");
    const aboutLink = links.find(link => link.textContent === "About");
    const contactLink = links.find(link => link.textContent === "Contact");
    const policyLink = links.find(link => link.textContent === "Privacy Policy");

    expect(aboutLink).toBeInTheDocument();
    expect(contactLink).toBeInTheDocument();
    expect(policyLink).toBeInTheDocument();

    // Click links and verify navigation
    await userEvent.click(aboutLink);
    expect(await screen.findByText("About Page")).toBeInTheDocument();

    expect(aboutLink).toBeInTheDocument();
    expect(contactLink).toBeInTheDocument();
    expect(policyLink).toBeInTheDocument();

    await userEvent.click(contactLink);
    expect(await screen.findByText("CONTACT US")).toBeInTheDocument();

    expect(aboutLink).toBeInTheDocument();
    expect(contactLink).toBeInTheDocument();
    expect(policyLink).toBeInTheDocument();
    
    await userEvent.click(policyLink);
    expect(await screen.findByText("privacy")).toBeInTheDocument();
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
