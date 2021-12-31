import React from "react";
import {
  // getByRole,
  // logRoles,
  // prettyDOM,
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ThemeProvider } from "constants/DefaultTheme";
import { lightTheme } from "selectors/themeSelectors";
import TreeDropdown, {
  calculatePrev,
  closeAllChildren,
  deepOpenChildren,
  setSelfIndex,
  TreeDropdownOption,
  // TreeDropdownProps,
} from "./TreeDropdown";
import { getItem, calculateNext, setItem } from "./TreeDropdown";

const optionTree: TreeDropdownOption[] = [
  {
    label: "No Action",
    value: "none",
  },
  {
    label: "Navigate To",
    value: "navigateTo",
  },
  {
    label: "Execute a query",
    value: "integration",
    children: [
      {
        label: "Query 1",
        value: "query1",
      },
      {
        label: "Query 2",
        value: "query2",
      },
    ],
  },
  {
    label: "Open Modal",
    value: "openModal",
  },
];

const testComponent = (fn: any = undefined) => (
  <ThemeProvider theme={lightTheme}>
    <TreeDropdown
      defaultText="Select Action"
      onSelect={fn}
      // onSelect={(val: TreeDropdownOption, defaultVal) => {}}
      optionTree={optionTree}
      selectedValue="none"
    />
  </ThemeProvider>
);

describe("<TreeDropdown/>", () => {
  it("Pressing Tab should focus the component", () => {
    render(testComponent());
    userEvent.tab();
    expect(screen.getByRole("button", { name: "No Action" })).toHaveFocus();
  });

  it.each(["{Enter}", " ", "{ArrowDown}", "{ArrowUp}"])(
    "Once focused, pressing '%s' should open dropdown",
    async (key) => {
      render(testComponent());
      expect(screen.queryByRole("list")).toBeNull();
      userEvent.tab();

      userEvent.keyboard(key);
      expect(screen.queryAllByRole("list")).not.toBeNull();

      // Escape to close opened dropdown
      userEvent.keyboard("{Escape}");
      await waitForElementToBeRemoved(screen.getAllByRole("list"));
    },
  );

  it("Pressing tab once dropdown is opened should close dropdown", async () => {
    render(testComponent());
    userEvent.tab();
    userEvent.keyboard("{Enter}");
    expect(screen.getAllByRole("list")).not.toBeNull();
    userEvent.tab();
    await waitForElementToBeRemoved(screen.getAllByRole("list"));
  });

  it("{ArrowDown} should select next item", () => {
    render(testComponent());
    userEvent.tab();
    expect(screen.getByRole("button")).toHaveTextContent("No Action");
    userEvent.keyboard("{Enter}");

    // Make sure first item is selected by default and not any other items
    expect(screen.getAllByRole("listitem")[0].querySelector("a")).toHaveClass(
      "bp3-active",
    );
    for (const [i, item] of screen.getAllByRole("listitem").entries()) {
      if (i !== 0) expect(item).not.toHaveClass("bp3-active");
    }

    userEvent.keyboard("{ArrowDown}");
    expect(screen.getAllByRole("listitem")[1].querySelector("a")).toHaveClass(
      "bp3-active",
    );
    for (const [i, item] of screen.getAllByRole("listitem").entries()) {
      if (i !== 1)
        expect(item.querySelector("a")).not.toHaveClass("bp3-active");
    }
  });

  it("{ArrowUp} should select next item", () => {
    render(testComponent());
    userEvent.tab();
    expect(screen.getByRole("button")).toHaveTextContent("No Action");
    userEvent.keyboard("{Enter}");

    // Make sure first item is selected by default and not any other items
    expect(screen.getAllByRole("listitem")[0].querySelector("a")).toHaveClass(
      "bp3-active",
    );
    for (const [i, item] of screen.getAllByRole("listitem").entries()) {
      if (i !== 0) expect(item).not.toHaveClass("bp3-active");
    }

    userEvent.keyboard("{ArrowUp}");
    expect(
      screen.getAllByRole("listitem")[optionTree.length - 1].querySelector("a"),
    ).toHaveClass("bp3-active");
    for (const [i, item] of screen.getAllByRole("listitem").entries()) {
      if (i !== optionTree.length - 1)
        expect(item.querySelector("a")).not.toHaveClass("bp3-active");
    }
  });

  it("After selecting an option using arrow, {enter} or ' ' should trigger onSelect", () => {
    const handleOnSelect = jest.fn();
    render(testComponent(handleOnSelect));
    userEvent.tab();
    userEvent.keyboard("{Enter}");
    userEvent.keyboard("{ArrowDown}");
    userEvent.keyboard("{Enter}");
    expect(handleOnSelect).toHaveBeenLastCalledWith(
      {
        label: optionTree[1].label,
        value: optionTree[1].value,
        selfIndex: [1],
      },
      undefined,
    );

    userEvent.keyboard("{Enter}");
    userEvent.keyboard("{ArrowDown}");
    userEvent.keyboard("{ArrowDown}");
    userEvent.keyboard("{Enter}");
    expect(handleOnSelect).toHaveBeenLastCalledWith(
      {
        label: optionTree[3].label,
        value: optionTree[3].value,
        selfIndex: [3],
      },
      undefined,
    );
  });

  it.todo("{enter} or ' ' on an item with children should open child menu");
  it.todo("child menu should be navigatable using arrow keys");
  it.todo("{enter} or ' ' on a child menu item should trigger onSelect");
  it.todo(
    "{enter} or ' ' on a child menu item with children should open it's child menu",
  );
});

describe("<TreeDropdown/> - utilities", () => {
  it("tests getItem", () => {
    expect(getItem(optionTree, [0])).toStrictEqual(optionTree[0]);
    expect(getItem(optionTree, [0, 1])).toStrictEqual(undefined);
    expect(getItem(optionTree, [-1])).toStrictEqual(undefined);
    expect(getItem(optionTree, [2, 1])).toStrictEqual(
      optionTree[2]?.children[1],
    );
  });

  it("tests calculateNext", () => {
    expect(calculateNext([0, 2], 4)).toStrictEqual([0, 3]);
    expect(calculateNext([-1], 4)).toStrictEqual([0]);
    expect(calculateNext([-1], 0)).toStrictEqual([0]);
    expect(calculateNext([0], 1)).toStrictEqual([1]);
    expect(calculateNext([4, 5, 6], 0)).toStrictEqual([4, 5, 0]);
    expect(calculateNext([4, 5, 6], 6)).toStrictEqual([4, 5, 0]);
  });

  it("tests calculatePrev", () => {
    expect(calculatePrev([0, 2], 4)).toStrictEqual([0, 1]);
    expect(calculatePrev([-1], 4)).toStrictEqual([4]);
    expect(calculatePrev([-1], 0)).toStrictEqual([0]);
    expect(calculatePrev([0], 1)).toStrictEqual([1]);
    expect(calculatePrev([1, 0], 4)).toStrictEqual([1, 4]);
    expect(calculatePrev([4, 5, 6], 0)).toStrictEqual([4, 5, 5]);
  });

  it("tests setItem", () => {
    expect(setItem(optionTree, [0], { label: "a", value: "a" })).toStrictEqual([
      { label: "a", value: "a" },
      ...optionTree.slice(1),
    ]);
    expect(setItem(optionTree, [2], { label: "a", value: "a" })).toStrictEqual([
      ...optionTree.slice(0, 2),
      { label: "a", value: "a" },
      ...optionTree.slice(3),
    ]);
    expect(
      setItem(optionTree, [2, 1], { label: "a", value: "a" }),
    ).toStrictEqual([
      ...optionTree.slice(0, 2),
      {
        ...optionTree[2],
        children: [
          ...(optionTree[2]?.children?.slice(0, 1) ?? []),
          { label: "a", value: "a" },
          ...(optionTree[2]?.children?.slice(2) ?? []),
        ],
      },
      ...optionTree.slice(2 + 1),
    ]);
    expect(
      setItem(optionTree, [2, 1], {
        ...getItem(optionTree, [2, 1]),
        value: "q2",
      }),
    ).toStrictEqual([
      ...optionTree.slice(0, 2),
      {
        ...optionTree[2],
        children: [
          ...(optionTree[2]?.children?.slice(0, 1) ?? []),
          { ...(optionTree[2]?.children[1] ?? {}), value: "q2" },
          ...(optionTree[2]?.children.slice(2) ?? []),
        ],
      },
      ...optionTree.slice(2 + 1),
    ]);
  });

  it("tests closeAllChildren", () => {
    const input = [
      { value: "1", label: "" },
      {
        value: "2",
        label: "",
        isChildrenOpen: true,
        children: [
          { value: "2.1", label: "" },
          {
            value: "2.1",
            label: "",
            isChildrenOpen: true,
            children: [
              { value: "2.11", label: "" },
              { value: "2.12", label: "" },
            ],
          },
          { value: "2.1", label: "" },
        ],
      },
      {
        value: "3",

        label: "",
        isChildrenOpen: false,
      },
      {
        value: "4",
        label: "",
        children: [
          { value: "4.1", label: "" },
          {
            value: "4.1",
            label: "",
            isChildrenOpen: true,
            children: [{ value: "4.11", label: "" }],
          },
        ],
      },
      { value: "5", label: "", isChildrenOpen: true },
    ];
    const output = [
      { value: "1", label: "" },
      {
        value: "2",
        label: "",
        isChildrenOpen: false,
        children: [
          { value: "2.1", label: "" },
          {
            value: "2.1",
            label: "",
            isChildrenOpen: false,
            children: [
              { value: "2.11", label: "" },
              { value: "2.12", label: "" },
            ],
          },
          { value: "2.1", label: "" },
        ],
      },
      {
        value: "3",

        label: "",
        isChildrenOpen: false,
      },
      {
        value: "4",
        label: "",
        children: [
          { value: "4.1", label: "" },
          {
            value: "4.1",
            label: "",
            isChildrenOpen: false,
            children: [{ value: "4.11", label: "" }],
          },
        ],
      },
      { value: "5", label: "", isChildrenOpen: false },
    ];
    expect(closeAllChildren(input)).toStrictEqual(output);
  });

  it("tests deepOpenChildren", () => {
    const input = [
      { value: "1", label: "" },
      {
        value: "2",
        label: "",
        isChildrenOpen: true,
        children: [
          { value: "2.1", label: "" },
          {
            value: "2.1",
            label: "",
            isChildrenOpen: true,
            children: [
              {
                value: "2.11",
                label: "",
                children: [
                  { value: "2.11.1", label: "" },
                  { value: "2.11.2", label: "" },
                ],
              },
              { value: "2.12", label: "" },
            ],
          },
          { value: "2.1", label: "" },
        ],
      },
      {
        value: "3",

        label: "",
        isChildrenOpen: false,
      },
      {
        value: "4",
        label: "",
        children: [
          { value: "4.1", label: "" },
          {
            value: "4.1",
            label: "",
            isChildrenOpen: true,
            children: [{ value: "4.11", label: "" }],
          },
        ],
      },
      { value: "5", label: "", isChildrenOpen: true },
    ];
    const output = [...input];
    output[1].isChildrenOpen = true;
    if (output[1]?.children[1]) output[1].children[1].isChildrenOpen = true;
    if (output[1]?.children[1]?.children[0])
      output[1].children[1].children[0].isChildrenOpen = true;
    expect(deepOpenChildren(input, [1, 1, 0])).toStrictEqual(output);
  });

  it("tests setSelfIndex", () => {
    const input = [
      { value: "1", label: "" },
      {
        value: "2",
        label: "",
        isChildrenOpen: true,
        children: [
          { value: "2.1", label: "" },
          {
            value: "2.1",
            label: "",
            isChildrenOpen: true,
            children: [
              {
                value: "2.11",
                label: "",
                children: [
                  { value: "2.11.1", label: "" },
                  { value: "2.11.2", label: "" },
                ],
              },
              { value: "2.12", label: "" },
            ],
          },
          { value: "2.1", label: "" },
        ],
      },
      {
        value: "3",

        label: "",
        isChildrenOpen: false,
      },
      {
        value: "4",
        label: "",
        children: [
          { value: "4.1", label: "" },
          {
            value: "4.1",
            label: "",
            isChildrenOpen: true,
            children: [{ value: "4.11", label: "" }],
          },
        ],
      },
      { value: "5", label: "", isChildrenOpen: true },
    ];
    const output = [
      { value: "1", label: "", selfIndex: [0] },
      {
        value: "2",
        label: "",
        selfIndex: [1],
        isChildrenOpen: true,
        children: [
          { value: "2.1", label: "", selfIndex: [1, 0] },
          {
            value: "2.1",
            label: "",
            selfIndex: [1, 1],
            isChildrenOpen: true,
            children: [
              {
                value: "2.11",
                label: "",
                selfIndex: [1, 1, 0],
                children: [
                  { value: "2.11.1", label: "", selfIndex: [1, 1, 0, 0] },
                  { value: "2.11.2", label: "", selfIndex: [1, 1, 0, 1] },
                ],
              },
              { value: "2.12", label: "", selfIndex: [1, 1, 1] },
            ],
          },
          { value: "2.1", label: "", selfIndex: [1, 2] },
        ],
      },
      {
        value: "3",
        label: "",
        selfIndex: [2],
        isChildrenOpen: false,
      },
      {
        value: "4",
        label: "",
        selfIndex: [3],
        children: [
          { value: "4.1", label: "", selfIndex: [3, 0] },
          {
            value: "4.1",
            label: "",
            selfIndex: [3, 1],
            isChildrenOpen: true,
            children: [{ value: "4.11", label: "", selfIndex: [3, 1, 0] }],
          },
        ],
      },
      { value: "5", label: "", selfIndex: [4], isChildrenOpen: true },
    ];
    expect(setSelfIndex(input)).toStrictEqual(output);
  });
});
