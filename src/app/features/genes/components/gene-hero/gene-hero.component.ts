import { Component, Input } from '@angular/core';

import { Gene } from '../../../../models';

@Component({
  selector: 'gene-hero',
  templateUrl: './gene-hero.component.html',
  styleUrls: ['./gene-hero.component.scss'],
})
export class GeneHeroComponent {
  @Input() gene: Gene | undefined;

  getSummary(body = false): string {
    if (this.gene?.summary) {
      let finalString = '';
      const parenthesisArr = this.gene.summary.split(/\(([^)]+)\)/g);
      if (parenthesisArr.length) {
        parenthesisArr.forEach((p, i, a) => {
          // Add the parenthesis back
          let auxString = '';
          if (i > 0) {
            auxString += i % 2 === 1 ? '(' : ')';
          }
          if (i < a.length - 1) {
            // Replace brackets with a space except the last one
            finalString += auxString + p.replace(/\[[^)]*\]/g, ' ');
          } else {
            finalString += auxString + p;
          }
        });
      }
      if (!finalString) {
        finalString = this.gene.summary;
      }
      const bracketsArr = finalString.split(/\[([^)]+)\]/g);
      if (bracketsArr.length && bracketsArr.length > 1) {
        // We have brackets so get the description and ref back
        if (body) {
          // Replace the spaces before and where the brackets were
          // with nothing
          return bracketsArr[0].replace(/  {2}/g, '');
        } else {
          // Return the last bracket string
          if (bracketsArr[1].includes(',')) {
            bracketsArr[1] = bracketsArr[1].split(',')[0];
          }
          return bracketsArr[1];
        }
      } else {
        // We dont have brackets so just get the description back
        if (body) {
          return finalString;
        } else {
          return '';
        }
      }
    } else {
      // If we don't have a summary, return a placeholder description and an empty ref
      if (body) {
        return '';
      } else {
        return '';
      }
    }
  }

  getAlias(): string {
    if (this.gene?.alias && this.gene.alias.length > 0) {
      return this.gene.alias.join(', ');
    }
    return '';
  }
}
