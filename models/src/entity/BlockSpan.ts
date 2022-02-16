import {Entity, PrimaryGeneratedColumn, Column, AfterInsert, AfterLoad, BeforeInsert, BeforeUpdate, Index, PrimaryColumn} from "typeorm";

const { SCAN_START_BLOCK, SCAN_CHUNK_SIZE } = process.env;

const scanOffset: number = (!SCAN_START_BLOCK) ? 10000000 : parseInt(SCAN_START_BLOCK, 10);
const scanChunkSize: number = (!SCAN_CHUNK_SIZE) ? 500 : parseInt(SCAN_CHUNK_SIZE, 10);

console.log({ scanOffset, scanChunkSize });

export enum Status {
    PROCESSING = "Processing",
    COMPLETE = "Complete",
    ERROR = "Error"
}

/* Notes:
    something (PG? TypeORM?) is 1-indexed
    span does not include toBlock
 */
@Entity()
export class BlockSpan {

    @PrimaryGeneratedColumn({type: "integer"}) // integer can support up to +2,147,483,647 spans
    id: number = 0;

    @Index()
    @Column({
        type: "enum",
        enum: Status,
        default: Status.PROCESSING
    })
    status: Status = Status.PROCESSING;

    fromBlock: number = this.getFromBlock();
    toBlock: number = this.getToBlock();
    range: number = scanChunkSize;
    spanOffset: number = this.getSpanOffset();

    @AfterInsert()
    @AfterLoad()
    hydrateValues() {
        this.fromBlock = this.getFromBlock();
        this.toBlock = this.getToBlock();
        this.spanOffset = this.getSpanOffset();
    }

    setComplete() {
        this.status = Status.COMPLETE;
    }

    getFromBlock() {
        return scanOffset + this.getSpanOffset();
    }

    getToBlock() {
        return this.getFromBlock() + this.range - 1;
    }

    getSpanOffset() {
        return (this.id - 1) * this.range;
    }

}
