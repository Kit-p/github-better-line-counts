import { tokenize } from "./tokenize";
import type { Attribute, Node, Rule } from "./parseAst";
import { parseAst } from "./parseAst";
import { matchesPattern } from "../patterns";

export class GitAttributes {
  ast: Node[];

  constructor(readonly text: string) {
    const tokens = tokenize(text);
    this.ast = parseAst(tokens);
  }

  evaluate(file: string): FileEvaluation {
    const rules = this.ast.filter((node) => node.type === "rule") as Rule[];
    const res: FileEvaluation = {
      attributes: {},
      appliedRules: [],
    };

    for (const rule of rules) {
      if (matchesPattern(file, rule.pattern)) {
        rule.attributes.forEach((attr) => {
          res.attributes[attr.name] = attr.value;
        });
        res.appliedRules.push(rule);
      }
    }
    return res;
  }
}

export interface FileEvaluation {
  attributes: Record<string, Attribute["value"]>;
  appliedRules: Rule[];
}
