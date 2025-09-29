import { Module } from "@nestjs/common";
import { StreamingController } from "./streaming.controller";

@Module({

    imports: [],
    controllers: [StreamingController],
    providers: [ ],
})
export class StreamingModule {}