import { addNewLane, addNewTask, AstPath, editLaneName, editTaskName, markdownAstToBoarddata, removeLane } from "../convertor";

//
// Interfaces for creating test data.
//

interface ITestTask {
    // The name of the task.
    name: string;
}

interface ITestColumn {

    // The name of the column.
    name: string;

    // Tasks in this column.
    tasks?: ITestTask[];
}

//
// Function to create test data.
//
function makeTestData(columns: ITestColumn[]): any {
    const children: any[] = [];

    for (const column of columns) {
        const columnName = column.name;
        children.push({
            "type": "heading",
            "depth": 3,
            "children": [
                {
                    "type": "text",
                    "value": columnName,
                },
            ],
        });

        const columnChildren: any[] = [];
        if (column.tasks) {
            for (const task of column.tasks) {
                columnChildren.push({
                    "type": "listItem",
                    "spread": false,
                    "checked": false,
                    "children": [
                        {
                            "type": "paragraph",
                            "children": [
                                {
                                    "type": "text",
                                    "value": task.name,
                                }
                            ]
                        }
                    ]
                });
            }
        }

        children.push({
            "type": "list",
            "ordered": false,
            "start": null,
            "spread": false,
            "children": columnChildren,
        });
    }

    return {
        "type": "root",
        "children": children,
    };
}

describe("deserialize markdown to board data", () => {


    it("can load empty board", () => {
        const emptyMarkdownAST = { 
            children: [],
        };
        const boardData = markdownAstToBoarddata(emptyMarkdownAST);
        expect(boardData).toEqual({
            lanes: [],
        });
    });

    it("can load a column", () => {

        const columnName = "Todo";
        const testMarkdownAST = makeTestData([ { name: columnName } ]);

        const boardData = markdownAstToBoarddata(testMarkdownAST);
        expect(boardData.lanes.length).toEqual(1);

        const lane = boardData.lanes[0];
        expect(lane.id).toEqual(columnName);
        expect(lane.title).toEqual(columnName);
    });

    it("can load a column with different data", () => {

        const columnName = "Blah";
        const testMarkdownAST = makeTestData([ { name: columnName } ]);

        const boardData = markdownAstToBoarddata(testMarkdownAST);
        expect(boardData.lanes.length).toEqual(1);

        const lane = boardData.lanes[0];
        expect(lane.id).toEqual(columnName);
        expect(lane.title).toEqual(columnName);
    });

    it("can load multiple columns", () => {

        const columnName1 = "Task1";
        const columnName2 = "Task2";
        const columns = [ { name: columnName1 }, { name: columnName2 } ];
        const testMarkdownAST = makeTestData(columns);

        const boardData = markdownAstToBoarddata(testMarkdownAST);
        expect(boardData.lanes.length).toEqual(2);
        
        const lane1 = boardData.lanes[0];
        expect(lane1.id).toEqual(columnName1);
        expect(lane1.title).toEqual(columnName1);

        const lane2 = boardData.lanes[1];
        expect(lane2.id).toEqual(columnName2);
        expect(lane2.title).toEqual(columnName2);
    });

    it("can load a task", () => {
        const testMarkdownAST = makeTestData([
            {
                name: "Todo",
                tasks: [
                    {
                        name: "Task",
                    },
                ],
            },
        ]);

        const boardData = markdownAstToBoarddata(testMarkdownAST);
        expect(boardData.lanes.length).toBe(1);
        
        const lane = boardData.lanes[0];
        expect(lane.cards.length).toEqual(1);

        const card = lane.cards[0];
        expect(card.id).toEqual("Task");
        expect(card.title).toEqual("Task");
    });

    it("can load a task with different data", () => {
        const testMarkdownAST = makeTestData([
            {
                name: "Todo",
                tasks: [
                    {
                        name: "AnotherTask",
                    },
                ],
            },
        ]);

        const boardData = markdownAstToBoarddata(testMarkdownAST);
        expect(boardData.lanes.length).toBe(1);
        
        const lane = boardData.lanes[0];
        expect(lane.cards.length).toEqual(1);

        const card = lane.cards[0];
        expect(card.id).toEqual("AnotherTask");
        expect(card.title).toEqual("AnotherTask");
    });

    it("can load multiple tasks", () => {
        const testMarkdownAST = makeTestData([
            {
                name: "Todo",
                tasks: [
                    {
                        name: "Task1",
                    },
                    {
                        name: "Task2",
                    },
                ],
            },
        ]);

        const boardData = markdownAstToBoarddata(testMarkdownAST);
        expect(boardData.lanes.length).toBe(1);

        const lane = boardData.lanes[0];
        expect(lane.cards.length).toEqual(2);

        const card1 = lane.cards[0];
        expect(card1.id).toEqual("Task1");
        expect(card1.title).toEqual("Task1");

        const card2 = lane.cards[1];
        expect(card2.id).toEqual("Task2");
        expect(card2.title).toEqual("Task2");
    });

    it("first loaded column has an AST path", () => {

        const testMarkdownAST = makeTestData([ { name: "Column" } ]);

        const boardData = markdownAstToBoarddata(testMarkdownAST);
        expect(boardData.lanes.length).toEqual(1);

        const lane = boardData.lanes[0];
        expect(lane.astPath).toEqual([ "children", 0 ]);
    });

    it("second loaded column has an AST path", () => {

        const testMarkdownAST = makeTestData([ 
            { 
                name: "Column1",
            },
            { 
                name: "Column2",
            },
        ]);

        const boardData = markdownAstToBoarddata(testMarkdownAST);
        expect(boardData.lanes.length).toEqual(2);

        const lane = boardData.lanes[1];
        expect(lane.astPath).toEqual([ "children", 2 ]);
    });
 

    it("first loaded task has an AST path", () => {
        const testMarkdownAST = makeTestData([
            {
                name: "Todo",
                tasks: [
                    {
                        name: "Task",
                    },
                ],
            },
        ]);

        const boardData = markdownAstToBoarddata(testMarkdownAST);
        expect(boardData.lanes.length).toEqual(1);

        const lane = boardData.lanes[0];
        expect(lane.cards.length).toEqual(1);

        const card = lane.cards[0];
        expect(card.astPath).toEqual([ "children", 1, "children", 0 ]);
    });

    it("second loaded task has an AST path", () => {
        const testMarkdownAST = makeTestData([
            {
                name: "Todo",
                tasks: [
                    {
                        name: "Task1",
                    },
                    {
                        name: "Task2",
                    },
                ],
            },
        ]);

        const boardData = markdownAstToBoarddata(testMarkdownAST);
        expect(boardData.lanes.length).toEqual(1);

        const lane = boardData.lanes[0];
        expect(lane.cards.length).toEqual(2);

        const card = lane.cards[1];
        expect(card.astPath).toEqual([ "children", 1, "children", 1 ]);
    });

    it("task from second column has an AST path", () => {
        const testMarkdownAST = makeTestData([
            {
                name: "Column1",
                tasks: [
                ],
            },
            {
                name: "Column2",
                tasks: [
                    {
                        name: "Task",
                    },
                ],
            },
        ]);

        const boardData = markdownAstToBoarddata(testMarkdownAST);
        expect(boardData.lanes.length).toEqual(2);

        const lane = boardData.lanes[1];
        expect(lane.cards.length).toEqual(1);

        const card = lane.cards[0];
        expect(card.astPath).toEqual([ "children", 3, "children", 0 ]);
    });

});

describe("update board data to markdown", () => {

    it("can update lane name in markdown AST", () => {

        const testMarkdownAst = makeTestData([ { name: "Old name" } ]);

        editLaneName([ "children", 0 ], "New name", testMarkdownAst);

        const expectedResultingMarkdownAst = makeTestData([ { name: "New name" } ]);
        expect(testMarkdownAst).toEqual(expectedResultingMarkdownAst)
    });

    it("can add new lane to empty markdown AST", () => {

        const testMarkdownAst = makeTestData([]);

        addNewLane("New lane", testMarkdownAst);

        const expectedResultingMarkdownAst = makeTestData([ { name: "New lane" } ]);
        expect(testMarkdownAst).toEqual(expectedResultingMarkdownAst);
    });

    it("can add new lane to existing markdown AST", () => {

        const testMarkdownAst = makeTestData([ { name: "Existing lane" } ]);

        addNewLane("New lane", testMarkdownAst);

        const expectedResultingMarkdownAst = makeTestData([ 
            { name: "Existing lane" }, 
            { name: "New lane" },
        ]);
        expect(testMarkdownAst).toEqual(expectedResultingMarkdownAst);
    });

    it("can remove only lane from a markdown AST", () => {

        const testMarkdownAst = makeTestData([  { name: "Existing lane" } ]);

        removeLane(["children", 0], testMarkdownAst);
        
        const expectedResultingMarkdownAst = makeTestData([]);
        expect(testMarkdownAst).toEqual(expectedResultingMarkdownAst);
    });

    it("can remove first lane from a markdown AST", () => {

        const testMarkdownAst = makeTestData([  { name: "Lane1" }, { name: "Lane2"}, ]);

        removeLane(["children", 0], testMarkdownAst);

        const expectedResultingMarkdownAst = makeTestData([ { name: "Lane2" } ]);
        expect(testMarkdownAst).toEqual(expectedResultingMarkdownAst);
    });

    it("can remove last lane from a markdown AST", () => {

        const testMarkdownAst = makeTestData([  { name: "Lane1" }, { name: "Lane2"}, ]);

        removeLane(["children", 2], testMarkdownAst);

        const expectedResultingMarkdownAst = makeTestData([ { name: "Lane1" } ]);
        expect(testMarkdownAst).toEqual(expectedResultingMarkdownAst);
    });

    it("can remove middle lane from a markdown AST", () => {

        const testMarkdownAst = makeTestData([  { name: "Lane1" }, { name: "Lane2"}, { name: "Lane3" }, ]);

        removeLane(["children", 2], testMarkdownAst);

        const expectedResultingMarkdownAst = makeTestData([ { name: "Lane1" },  { name: "Lane3" } ]);
        expect(testMarkdownAst).toEqual(expectedResultingMarkdownAst);
    });

    it("can update task name in markdown AST", () => {

        const testMarkdownAst = makeTestData([ 
            { 
                name: "Lane", 
                tasks: [
                    {
                        name: "Old task name",
                    },
                ],
            },
        ]);
        
        const taskId = [ "children", 1, "children", 0, "children", 0 ];

        editTaskName(taskId, "New task name", testMarkdownAst);

        const expectedResultingMarkdownAst = makeTestData([ 
            { 
                name: "Lane", 
                tasks: [
                    {
                        name: "New task name",
                    },
                ],
            },
        ]);

        expect(testMarkdownAst).toEqual(expectedResultingMarkdownAst)
    });

    it("can add a task to an empty lane in markdown AST", () => {

        const testMarkdownAst = makeTestData([ 
            { 
                name: "Lane", 
                tasks: [
                ],
            },
        ]);
        
        const laneId = [ "children", 0 ];

        addNewTask(laneId, "New task name", testMarkdownAst);

        const expectedResultingMarkdownAst = makeTestData([ 
            { 
                name: "Lane", 
                tasks: [
                    {
                        name: "New task name",
                    },
                ],
            },
        ]);

        expect(testMarkdownAst).toEqual(expectedResultingMarkdownAst)
    });

    it("can add a new task to a lane in markdown AST", () => {

        const testMarkdownAst = makeTestData([ 
            { 
                name: "Lane", 
                tasks: [
                    {
                        name: "Task1",
                    },
                ],
            },
        ]);
        
        const laneId = [ "children", 0 ];

        addNewTask(laneId, "Task2", testMarkdownAst);

        const expectedResultingMarkdownAst = makeTestData([ 
            { 
                name: "Lane", 
                tasks: [
                    {
                        name: "Task1",
                    },
                    {
                        name: "Task2",
                    },
                ],
            },
        ]);

        expect(testMarkdownAst).toEqual(expectedResultingMarkdownAst)
    });
});

// 
// loading tasks
// 
//  write a test that checks that where there is no list it can be handled
//  write tests to check required children in the AST are missing
//  tests for other edge cases
// 
// editing tests
//
//  can add task
//  can delete task
//  handles deleting a lane from an empty board
//  handles removing a lane when laneId is an invalid path
//  handles removing a lane when requested lane is not found in the board.
//
