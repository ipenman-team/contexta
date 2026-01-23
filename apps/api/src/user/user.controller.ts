
import {
    Body,
    Controller,
    Get,
    Put,
} from '@nestjs/common';
import { TenantId, UserId } from '../common/tenant/tenant-id.decorator';
import { UserService } from './user.service';

@Controller('users')
export class UserController {

    constructor(private userService: UserService) { }

    @Get('me')
    me(@UserId() userId: string | undefined, @TenantId() tenantId: string) {
        return this.userService.me({ userId: userId ?? '', tenantId });
    }

    @Put('profile')
    updateProfile(
        @UserId() userId: string | undefined,
        @Body() body: UpdateProfileBody,
    ) {
        return this.userService.updateProfile({
            userId: userId ?? '',
            nickname: body.nickname,
            avatarUrl: body.avatarUrl,
            bio: body.bio,
        });
    }
}