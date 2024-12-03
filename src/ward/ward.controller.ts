import { Controller, Get, Post, Body, Put, Param, Delete, NotFoundException } from '@nestjs/common';
import { WardService } from './ward.service';
import { CreateWardDto } from './dto/create-ward.dto';
import { UpdateWardDto } from './dto/update-ward.dto';

@Controller('ward')
export class WardController {
  constructor(private readonly wardService: WardService) {}

  @Post()
  async create(@Body() createWardDto: CreateWardDto) {
    return this.wardService.create(createWardDto);
  }

  @Get()
  async findAll() {
    return this.wardService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const ward = await this.wardService.findOne(id);
    if (!ward) throw new NotFoundException("Ward not found");
    return ward;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateWardDto: UpdateWardDto) {
    return this.wardService.update(id, updateWardDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.wardService.remove(id);
  }
}
