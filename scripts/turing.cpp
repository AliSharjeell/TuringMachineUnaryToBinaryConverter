#include <iostream>
#include <vector>
#include <string>
#include "json.hpp"

using json = nlohmann::json;
using namespace std;

const int TAPE_SIZE = 20;

string tapeToString(const vector<char> &tape)
{
    return string(tape.begin(), tape.end());
}

void moveHeadSmoothly(int &head, int target, int &step, json &output, const vector<char> &tape, int state)
{
    while (head != target)
    {
        head += (head < target) ? 1 : -1;
        output.push_back({{"step", step++},
                          {"headIndex", head},
                          {"tape", tapeToString(tape)},
                          {"state", state}});
    }
}

void simulateTuringMachine(vector<char> &tape, int &head, json &output)
{
    int step = 1;
    int state = 0;

    output.push_back({{"step", step++},
                      {"headIndex", head},
                      {"tape", tapeToString(tape)},
                      {"state", state}});

    while (head >= 0 && head < TAPE_SIZE)
    {
        char current = tape[head];
        char write = current;
        int move = 0;
        int nextState = state;

        if (state == 0)
        {
            if (current == '1')
            {
                write = 'X';
                move = -1;
                nextState = 1;
            }
            else if (current == 'X' || current == 'D')
            {
                write = current;
                move = 1;
                nextState = 0;
            }
            else if (current == 'B')
            {
                write = 'B';
                move = -1;
                nextState = 2;
            }
            else
            {
                break;
            }
        }
        else if (state == 1)
        {
            if (current == 'X')
            {
                write = 'X';
                move = -1;
                nextState = 1;
            }
            else if (current == 'C')
            {
                write = 'D';
                move = -1;
                nextState = 1;
            }
            else if (current == 'B' || current == 'D')
            {
                write = 'C';
                move = 1;
                nextState = 0;
            }
            else
            {
                break;
            }
        }
        else
        {
            // State 2 or undefined = halt
            break;
        }

        tape[head] = write;
        output.push_back({{"step", step++},
                          {"headIndex", head},
                          {"tape", tapeToString(tape)},
                          {"state", state}});

        int newHead = head + move;
        moveHeadSmoothly(head, newHead, step, output, tape, nextState);
        state = nextState;
    }
}

int main(int argc, char *argv[])
{
    if (argc != 2)
    {
        cerr << "Usage: ./turing <unary_input>\nExample: ./turing 111\n";
        return 1;
    }

    string unary = argv[1];
    for (char c : unary)
    {
        if (c != '1')
        {
            cerr << "Error: Input must be unary (only 1s)\n";
            return 1;
        }
    }

    int unaryLength = unary.size();
    if (unaryLength > TAPE_SIZE)
    {
        cerr << "Error: Input too long for fixed tape size.\n";
        return 1;
    }

    vector<char> tape(TAPE_SIZE, 'B');
    int unaryStart = TAPE_SIZE - unaryLength;
    for (int i = 0; i < unaryLength; ++i)
    {
        tape[unaryStart + i] = '1';
    }

    int head = unaryStart;
    json output = json::array();

    simulateTuringMachine(tape, head, output);

    cout << output.dump(4) << endl;
    return 0;
}
