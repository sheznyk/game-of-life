import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  NgZone,
  OnInit,
} from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';

export const NEIBORS_MASK = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];
export interface Cell {
  x: number;
  y: number;
  neibors: number[];
}

function createCell(
  x: number,
  y: number,
  maxX: number,
  maxY: number,
  neiborsMask = NEIBORS_MASK
): Cell {
  return { x, y, neibors: calculateNeibors(x, y, maxX, maxY, neiborsMask) };
}

function calculateNeibors(
  x: number,
  y: number,
  maxX: number,
  maxY: number,
  neiborsMask: number[][]
): number[] {
  return neiborsMask.map(([shiftX, shiftY]) => {
    const shiftedX = x + shiftX;
    const shiftedY = y + shiftY;
    return (
      comparePointOnAxis(shiftedX, maxX) + comparePointOnAxis(shiftedY, maxY) * maxX
    );
  });
}

function calcLifePoints(neibors: number[], cellAliveList: boolean[]): number {
  return neibors.reduce((lifePoints: number, cellIndex: number) => {
    return lifePoints + +cellAliveList[cellIndex];
  }, 0);
}

function extinction(lifePoints: number, isAlive: boolean): boolean {
  if (!isAlive && lifePoints === 3) {
    return true;
  } else if (isAlive && (lifePoints < 2 || lifePoints > 3)) {
    return false;
  }
  return isAlive;
}

function comparePointOnAxis(point: number, maxPoint: number): number {
  if (point === -1) {
    return  maxPoint - 1;
  } else if (point === maxPoint) {
    return 0;
  }
  return point;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit, OnInit {
  private resolution = 3;
  private frmaesPerSecond = 60;
  private worldDesk: Cell[] = [];
  private prevCellAlive: boolean[] = [];
  private nextCellAlive: boolean[] = [];
  ctx: CanvasRenderingContext2D;
  @ViewChild('canvasWorldDesk', { static: true })
  canvasWorldDesk: ElementRef<HTMLCanvasElement>;

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit() {
    this.ctx = this.canvasWorldDesk.nativeElement.getContext('2d');
    this.ctx.fillStyle = 'black';
    this.ctx.strokeStyle = 'black';
    this.ngZone.runOutsideAngular( () => this.generateWorldDesk());
  }

  ngOnInit() {
  }

  generateWorldDesk() {
    const columns = this.canvasWorldDesk.nativeElement.width / this.resolution;
    const rows = this.canvasWorldDesk.nativeElement.height / this.resolution;
    this.prevCellAlive = Array.from({ length: columns * rows }, () => Boolean(Math.floor(Math.random() * 2)));
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        this.worldDesk.push(createCell(x, y, columns, rows));
      }
    }

    requestAnimationFrame(() => this.newIterationWorldDesk());
  }

  newIterationWorldDesk() {
    this.ctx.fillRect(
      0,
      0,
      this.canvasWorldDesk.nativeElement.width,
      this.canvasWorldDesk.nativeElement.height
    );
    for (let cellIndex = 0; cellIndex < this.prevCellAlive.length; cellIndex++) {
      const { x, y, neibors } = this.worldDesk[cellIndex];
      const isAlive = this.prevCellAlive[cellIndex];
      if (isAlive) {

        this.ctx.beginPath();
        this.ctx.clearRect(
          x * this.resolution,
          y * this.resolution,
          this.resolution,
          this.resolution
        );
        this.ctx.strokeRect(
          x * this.resolution,
          y * this.resolution,
          this.resolution,
          this.resolution
        );
        this.ctx.closePath();
      }
      const lifePoints = calcLifePoints(neibors, this.prevCellAlive);
      this.nextCellAlive[cellIndex] = extinction(lifePoints, isAlive);
    }

    this.prevCellAlive = [...this.nextCellAlive];
    this.nextCellAlive = []
    setTimeout(
      () => requestAnimationFrame(() => this.newIterationWorldDesk()),
      1000 / this.frmaesPerSecond
    );
  }
}
