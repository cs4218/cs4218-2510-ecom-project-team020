// This file contains unit tests generated with AI assistance but curated, validated and refined by me.
import React from "react";
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from "@testing-library/react";
import Footer from "./Footer";
import '@testing-library/jest-dom/extend-expect';

describe("Footer Component", () => {
    describe("Component Static Rendering", () => {
        it("renders copyright text with company name", () => {
            render(
                <MemoryRouter>
                    <Footer />
                </MemoryRouter>
            );

            expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent(
                "All Rights Reserved © TestingComp"
            );
        });

        it("renders links with pipe separators", () => {
            render(
                <MemoryRouter>
                    <Footer />
                </MemoryRouter>
            );

            const paragraph = screen.getByText((content, element) => {
                return element.tagName.toLowerCase() === 'p';
            });
            expect(paragraph.textContent).toContain('|');
        });

        it("renders all three footer navigation links", () => {
            render(
                <MemoryRouter>
                    <Footer />
                </MemoryRouter>
            );

            const aboutLink = screen.getByRole('link', { name: /about/i });
            const contactLink = screen.getByRole('link', { name: /contact/i });
            const policyLink = screen.getByRole('link', { name: /privacy policy/i });

            expect(aboutLink).toBeInTheDocument();
            expect(contactLink).toBeInTheDocument();
            expect(policyLink).toBeInTheDocument();
        });

        it("renders About link with correct route", () => {
            render(
                <MemoryRouter>
                    <Footer />
                </MemoryRouter>
            );

            const aboutLink = screen.getByRole('link', { name: /about/i });
            expect(aboutLink).toHaveAttribute('href', '/about');
        });

        it("renders Contact link with correct route", () => {
            render(
                <MemoryRouter>
                    <Footer />
                </MemoryRouter>
            );

            const contactLink = screen.getByRole('link', { name: /contact/i });
            expect(contactLink).toHaveAttribute('href', '/contact');
        });

        it("renders Privacy Policy link with correct route", () => {
            render(
                <MemoryRouter>
                    <Footer />
                </MemoryRouter>
            );

            const policyLink = screen.getByRole('link', { name: /privacy policy/i });
            expect(policyLink).toHaveAttribute('href', '/policy');
        });
    });

    describe("Link Functionality", () => {
        it("renders About link as an interactive element", () => {
            render(
                <MemoryRouter>
                    <Footer />
                </MemoryRouter>
            );

            const aboutLink = screen.getByRole('link', { name: /about/i });
            expect(aboutLink).not.toBeDisabled();
        });

        it("renders Contact link as an interactive element", () => {
            render(
                <MemoryRouter>
                    <Footer />
                </MemoryRouter>
            );

            const contactLink = screen.getByRole('link', { name: /contact/i });
            expect(contactLink).not.toBeDisabled();
        });

        it("renders Privacy Policy link as an interactive element", () => {
            render(
                <MemoryRouter>
                    <Footer />
                </MemoryRouter>
            );

            const policyLink = screen.getByRole('link', { name: /privacy policy/i });
            expect(policyLink).not.toBeDisabled();
        });
    });
});