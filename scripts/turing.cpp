#include <iostream>
#include <vector>
#include <string>
#include "json.hpp"

using json = nlohmann::json;
using namespace std;

const int TAPE_SIZE = 20; // ← Updated from 15 to 20

string tapeToString(const vector<char> &tape)
{
    return string(tape.begin(), tape.end());
}

void incrementBinary(vector<char> &tape, int &head, int &step, json &output)
{
    while (head >= 0)
    {
        if (tape[head] == 'B')
        {
            tape[head] = 'C';
            output.push_back({{"step", step++}, {"headIndex", head}, {"tape", tapeToString(tape)}});
            break;
        }
        else if (tape[head] == 'C')
        {
            tape[head] = 'D';
            output.push_back({{"step", step++}, {"headIndex", head}, {"tape", tapeToString(tape)}});
            head--;
        }
        else if (tape[head] == 'D')
        {
            tape[head] = 'C';
            output.push_back({{"step", step++}, {"headIndex", head}, {"tape", tapeToString(tape)}});
            break;
        }
        else
        {
            head--;
        }
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
    int step = 1;
    json output = json::array();
    output.push_back({{"step", step++}, {"headIndex", head}, {"tape", tapeToString(tape)}});

    while (head < TAPE_SIZE)
    {
        if (tape[head] == '1')
        {
            tape[head] = 'X';
            output.push_back({{"step", step++}, {"headIndex", head}, {"tape", tapeToString(tape)}});

            head--;
            output.push_back({{"step", step++}, {"headIndex", head}, {"tape", tapeToString(tape)}});

            incrementBinary(tape, head, step, output);

            head = unaryStart;
            while (head < TAPE_SIZE && tape[head] != '1')
            {
                head++;
            }
            if (head < TAPE_SIZE)
            {
                output.push_back({{"step", step++}, {"headIndex", head}, {"tape", tapeToString(tape)}});
            }
        }
        else
        {
            break;
        }
    }

    cout << output.dump(4) << endl;
    return 0;
}
