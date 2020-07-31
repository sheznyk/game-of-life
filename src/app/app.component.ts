import { Component, ViewChild, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';


export const neiborsMask = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
export class Cell {
  x: number;
  y: number;
  private alive: number;
  private generation: Array<number> = [];
  private neiborsArray: Cell[];

  get isAlive(): number {
    return this.alive;
  }

  set neibors(value: Cell) {
    this.neiborsArray.push(value);
  }

  extinction(generationId: number) {
    const lifePoints = this.neiborsArray.reduce((sum: number, cell: Cell) => sum += cell.generation[generationId], 0);
    if (this.alive === 0 && lifePoints === 3) {
      this.alive = 1;
    } else if (this.alive === 1 && (lifePoints < 2 || lifePoints > 3)) {
      this.alive = 0;
    }
    this.generation.push(this.alive);
  }

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.alive = Math.floor(Math.random() * 2);
    this.generation.push(this.alive);
    this.neiborsArray = new Array<Cell>();
  }

}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit {

  private resolution = 10;
  private worldDesk: Cell[];
  private generationId = 0;
  ctx: CanvasRenderingContext2D;
  @ViewChild('canvasWorldDesk', { static: true }) canvasWorldDesk: ElementRef<HTMLCanvasElement>;

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit() {
    this.ctx = this.canvasWorldDesk.nativeElement.getContext('2d');
    this.ctx.fillStyle = 'black';
    this.ctx.strokeStyle = 'black';
    this.ngZone.runOutsideAngular(() => this.generateWorldDesk());
    requestAnimationFrame(() => this.newIterationWorldDesk());
  }

  generateWorldDesk() {
    const columns = this.canvasWorldDesk.nativeElement.width / this.resolution;
    const rows = this.canvasWorldDesk.nativeElement.height / this.resolution;
    this.worldDesk = new Array<Cell>();
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const cell = new Cell(x, y);
        this.worldDesk.push(cell);
      }
    }
    for (const cell of this.worldDesk) {
      for (const neiborXY of neiborsMask) {
        let neiborX = neiborXY[0] + cell.x;
        let neiborY = neiborXY[1] + cell.y;

        if (neiborX === -1) {
          neiborX = columns - 1;
        } else if (neiborX === columns) {
          neiborX = 0;
        }

        if (neiborY === -1) {
          neiborY = rows - 1;
        } else if (neiborY === rows) {
          neiborY = 0;
        }

        cell.neibors = this.worldDesk.find(el => el.x === neiborX && el.y === neiborY);

      }

    }

  }

  newIterationWorldDesk() {
    requestAnimationFrame(() =>
    this.ctx.fillRect(0, 0, this.canvasWorldDesk.nativeElement.width, this.canvasWorldDesk.nativeElement.height));
    for (const cell of this.worldDesk) {
      if (cell.isAlive === 1) {
        requestAnimationFrame( () => {
          this.ctx.beginPath();
          this.ctx.clearRect(cell.x * this.resolution, cell.y * this.resolution, this.resolution, this.resolution);
          this.ctx.strokeRect(cell.x * this.resolution, cell.y * this.resolution, this.resolution, this.resolution);
          this.ctx.closePath();
        });
      }
    }

    for (const cell of this.worldDesk) {
      cell.extinction(this.generationId);
    }
    this.generationId++;
    setTimeout( () =>
    requestAnimationFrame(() => this.newIterationWorldDesk()), 5);
  }

}
