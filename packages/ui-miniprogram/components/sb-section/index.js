/**
 * 区块卡片（14 章「一层一圈边」「留白就是分组」）：白底一圈细线的卡片，标题 16px、说明 14px、右侧可带一个链接动作。
 * 卡里面不要再套带边框的小卡，分组用间距。plain=true 时不画卡片（只要标题行，放在已有容器里）。
 * 事件 extra：点了右侧链接。slot：默认内容；name="extra" 自定义右侧（不传 extraLabel 时用）
 */
Component({
  options: { addGlobalClass: true, multipleSlots: true },
  properties: { title: String, description: String, extraLabel: String, plain: { type: Boolean, value: false } },
  methods: { onExtra() { this.triggerEvent('extra'); } },
});
