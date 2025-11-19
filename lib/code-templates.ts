export const codeTemplates: Record<string, string> = {
  c: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  python: `print("Hello, World!")`,
};

export const languageExtensions: Record<string, string> = {
  c: '.c',
  cpp: '.cpp',
  java: '.java',
  python: '.py',
};

export const languageNames: Record<string, string> = {
  c: 'C',
  cpp: 'C++',
  java: 'Java',
  python: 'Python',
};
