import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { MaterialModule } from "src/app/app.module";
import { PaginationModule } from "src/app/shared/pagination/pagination.module";
import { channelNewsRoutes } from "./channel-news.routing";
import { CustomerChannelNewsComponent } from "./channel-news.component";

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(channelNewsRoutes),
    MaterialModule,
    PaginationModule,
  ],
  declarations: [CustomerChannelNewsComponent],
})
export class ChannelNewsModule {}
