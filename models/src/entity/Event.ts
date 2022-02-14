import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

/* 
    TODO:
        - `id` should be something like `blockNumber + logIndex` from original event
        - more granular columns per each argument in `args`
        - different entities for Event types with different arguments in `args`
 */
@Entity()
export class Event {

    @PrimaryGeneratedColumn()
    id: number = 0;

    @Column()
    type: string = "";

    @Column()
    args: string = "";

    @Column('boolean', { default: false })
    isRead: boolean = false;

}
