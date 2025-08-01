# UI Component Testing

This directory contains UI component tests using Jest and React Testing Library.

## Quick Start

```bash
# Run all UI tests
npm run test:ui

# Run UI tests in watch mode
npm run test:ui:watch

# Run both RLS and UI tests
npm test
```

## Overview

UI tests focus on component behavior, user interactions, and frontend functionality. These tests ensure your React components work correctly and provide a good user experience.

**Key Areas:**

- Component behavior and user interactions
- State management and side effects
- Integration with hooks and contexts
- Accessibility and user experience
- Error handling and edge cases

## Test Structure

UI tests are organized to mirror the src directory structure:

```
tests/ui/
├── README.md              # This documentation
├── test-utils.tsx         # Shared testing utilities
├── components/            # Component tests mirroring src/components/
│   ├── Auth/              # Authentication components
│   ├── Tenants/           # Tenant management (existing tests)
│   ├── Events/            # Event components
│   ├── Members/           # Member components
│   ├── Services/          # Service components
│   ├── Groups/            # Group components
│   ├── Resources/         # Resource components
│   ├── Profile/           # Profile components
│   ├── Layout/            # Layout components
│   ├── Landing/           # Landing page components
│   └── shared/            # Shared/reusable components
├── pages/                 # Page tests mirroring src/pages/
├── hooks/                 # Hook tests mirroring src/hooks/
├── contexts/              # Context tests mirroring src/contexts/
└── lib/                   # Utility/service tests mirroring src/lib/
```

**Finding Tests:** `src/components/Tenants/TenantCard.tsx` → `tests/ui/components/Tenants/TenantCard.test.tsx`

## Authentication Testing

The test utilities provide helper functions for common authentication scenarios:

### Using Helper Functions (Recommended)

```tsx
// User is loading (most common initial state)
mockUseSessionHelpers.loading();

// User is not authenticated
mockUseSessionHelpers.unauthenticated();

// User is authenticated with default profile
mockUseSessionHelpers.authenticated();

// User is authenticated but no profile loaded
mockUseSessionHelpers.authenticatedNoProfile();

// User with custom data
mockUseSessionHelpers.withUser({ email: "custom@example.com" });

// User with custom profile
mockUseSessionHelpers.withProfile({ full_name: "Custom Name" });

// Authenticated user with custom user and profile data
mockUseSessionHelpers.authenticated(
  { email: "override@example.com" },
  { full_name: "Override Name" },
);
```

### Using Direct Mock (For Complex Cases)

```tsx
// Direct mock session state for complex scenarios
mockUseSession({
  session: mockSession,
  user: mockUser,
  profile: mockProfile,
  isLoading: false,
  signOut: jest.fn().mockResolvedValue(undefined),
  refetchProfile: jest.fn().mockResolvedValue(undefined),
});
```

### Testing Authentication Flows

```tsx
// Test loading state
mockUseSessionHelpers.loading();
render(<Component />);
expect(screen.getByText("Loading...")).toBeInTheDocument();

// Test unauthenticated redirect
mockUseSessionHelpers.unauthenticated();
render(<Component />);
expect(mockNavigate).toHaveBeenCalledWith("/auth");

// Test authenticated state
mockUseSessionHelpers.authenticated();
render(<Component />);
expect(screen.getByText("Welcome")).toBeInTheDocument();
```

### Session Helper Benefits

The `mockUseSessionHelpers` functions provide several advantages:

1. **Consistent Defaults**: All helpers use sensible default values
2. **Type Safety**: Full TypeScript support with proper types
3. **Readability**: Clear, semantic function names
4. **Maintainability**: Centralized session state management
5. **Flexibility**: Override defaults when needed
6. **Performance**: Optimized for common test scenarios

### Available Mock Data

The test utilities export several pre-configured mock objects:

```tsx
// Default mock user
export const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  // ... other user properties
};

// Default mock profile
export const mockProfile = {
  id: "profile-id-456",
  full_name: "Test User",
  first_name: "Test",
  last_name: "User",
  email: "test@example.com",
  // ... other profile properties
};

// Default mock session
export const mockSession = {
  access_token: "mock_access_token",
  user: mockUser,
  // ... other session properties
};

// Default mock tenant
export const mockTenant = {
  id: "test-tenant-id",
  name: "Test Church",
  slug: "test-church",
  // ... other tenant properties
};
```

### Custom Data Override Examples

```tsx
// Custom profile with specific data
mockUseSessionHelpers.withProfile({
  full_name: "John Doe",
  first_name: "John",
  last_name: "Doe",
});

// Custom user email
mockUseSessionHelpers.withUser({
  email: "specific@example.com",
});
```

## Writing Tests

### Basic Test Structure

```tsx
import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "../../test-utils";
import { MyComponent } from "@/components/MyComponent";

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });

  it("should handle user interactions", async () => {
    const user = userEvent.setup();
    render(<MyComponent />);

    const button = screen.getByRole("button", { name: "Click me" });
    await user.click(button);

    expect(screen.getByText("Clicked!")).toBeInTheDocument();
  });
});
```

### Automatic Mocking

The test setup automatically mocks common dependencies:

- **React Router**: Navigation functions are mocked
- **React i18next**: Translation keys are returned as-is
- **Supabase**: Database operations are mocked
- **useSession**: Returns test user data
- **Lucide Icons**: Replaced with test-friendly SVG elements

### Custom Mocking

```tsx
// Mock a service function
jest.mock("@/lib/my-service", () => ({
  myFunction: jest.fn(),
}));

// Mock a hook
jest.mock("@/hooks/useMyHook", () => ({
  useMyHook: () => ({ data: "mock-data", isLoading: false }),
}));
```

### Testing Async Operations

```tsx
it("should handle async operations", async () => {
  const mockAsyncFunction = jest.fn().mockResolvedValue("success");

  render(<MyComponent asyncFunction={mockAsyncFunction} />);

  const button = screen.getByRole("button");
  await user.click(button);

  await waitFor(() => {
    expect(screen.getByText("success")).toBeInTheDocument();
  });
});
```

### Testing Forms

```tsx
it("should submit form with correct data", async () => {
  const user = userEvent.setup();
  const mockSubmit = jest.fn();

  render(<MyForm onSubmit={mockSubmit} />);

  await user.type(screen.getByLabelText("Name"), "Test Name");
  await user.click(screen.getByRole("button", { name: "Submit" }));

  expect(mockSubmit).toHaveBeenCalledWith({ name: "Test Name" });
});
```

## Testing Patterns

### 1. Test User Behavior

Focus on user-visible behavior rather than implementation details:

```tsx
// ✅ Good - tests user behavior
expect(screen.getByText("Dashboard")).toBeInTheDocument();
await user.click(screen.getByRole("button", { name: "Add Church" }));

// ❌ Avoid - tests implementation details
expect(component.state.isDialogOpen).toBe(true);
```

### 2. Use Semantic Queries

Prefer queries that match how users interact with your app:

```tsx
// ✅ Good - semantic queries
screen.getByRole("button", { name: "Submit" });
screen.getByLabelText("Email address");
screen.getByText("Welcome!");

// ❌ Avoid - implementation-dependent queries
screen.getByClassName("submit-btn");
screen.getById("email-input");
```

### 3. Test Error and Loading States

```tsx
it("should show error when operation fails", async () => {
  mockService.deleteItem.mockRejectedValue(new Error("Delete failed"));

  render(<ItemCard item={mockItem} />);

  await user.click(screen.getByRole("button", { name: "Delete" }));

  await waitFor(() => {
    expect(screen.getByText("Delete failed")).toBeInTheDocument();
  });
});

it("should show loading state", () => {
  render(<DataComponent isLoading={true} />);
  expect(screen.getByText("Loading...")).toBeInTheDocument();
});
```

### 4. Test Accessibility

```tsx
it("should be accessible", () => {
  render(<MyComponent />);

  // Check for proper headings
  expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();

  // Check for proper labels
  expect(screen.getByLabelText("Email")).toBeInTheDocument();

  // Check keyboard navigation
  const button = screen.getByRole("button");
  expect(button).not.toHaveAttribute("tabindex", "-1");
});
```

## Best Practices

### Test Organization

```tsx
describe("ComponentName", () => {
  describe("Rendering", () => {
    it("should render with required props", () => {});
    it("should handle optional props", () => {});
  });

  describe("User Interactions", () => {
    it("should handle button clicks", async () => {});
    it("should handle form submissions", async () => {});
  });

  describe("Error Handling", () => {
    it("should display error messages", () => {});
    it("should handle network errors", async () => {});
  });
});
```

### Test Names

Use descriptive test names:

```tsx
// ✅ Good - descriptive names
it("should show error message when email is invalid");
it("should disable submit button when form is incomplete");
it("should redirect to login when user is not authenticated");

// ❌ Avoid - vague names
it("should work correctly");
it("should handle input");
```

### Cleanup

```tsx
afterEach(() => {
  jest.clearAllMocks();
  // cleanup() is automatically called by test-utils
});
```

## Debugging Tests

### Common Issues

1. **Element not found**: Use `screen.debug()` to see the rendered DOM
2. **Async timing**: Use `waitFor()` for async operations
3. **Mock not working**: Check mock implementation and reset between tests
4. **Translation keys**: Remember that `t()` returns the key itself in tests

### Debugging Commands

```tsx
// Print the entire DOM
screen.debug();

// Print a specific element
screen.debug(screen.getByRole("button"));

// Print all available queries
screen.logTestingPlaygroundURL();
```

## Integration with E2E Tests

- **UI tests**: Component logic, user interactions, error handling, edge cases
- **E2E tests**: Multi-page flows, real authentication, database integration, cross-browser compatibility

Use the right tool for the right job!
