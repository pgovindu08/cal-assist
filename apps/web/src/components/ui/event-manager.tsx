"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, Grid3x3, List, Search, Filter, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface Event {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  color: string
  category?: string
  attendees?: string[]
  tags?: string[]
}

export interface EventManagerProps {
  events?: Event[]
  onEventCreate?: (event: Omit<Event, "id">) => void
  onEventUpdate?: (id: string, event: Partial<Event>) => void
  onEventDelete?: (id: string) => void
  categories?: string[]
  colors?: { name: string; value: string; bg: string; text: string }[]
  defaultView?: "month" | "week" | "day" | "list"
  className?: string
  availableTags?: string[]
}

const defaultColors = [
  { name: "Blue", value: "blue", bg: "bg-blue-500", text: "text-blue-700" },
  { name: "Green", value: "green", bg: "bg-green-500", text: "text-green-700" },
  { name: "Purple", value: "purple", bg: "bg-purple-500", text: "text-purple-700" },
  { name: "Orange", value: "orange", bg: "bg-orange-500", text: "text-orange-700" },
  { name: "Pink", value: "pink", bg: "bg-pink-500", text: "text-pink-700" },
  { name: "Red", value: "red", bg: "bg-red-500", text: "text-red-700" },
]

export function EventManager({
  events: initialEvents = [],
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  categories = ["Meeting", "Task", "Reminder", "Personal"],
  colors = defaultColors,
  defaultView = "month",
  className,
  availableTags = ["Important", "Urgent", "Work", "Personal", "Team", "Client"],
}: EventManagerProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"month" | "week" | "day" | "list">(defaultView)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null)
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: "",
    description: "",
    color: colors[0].value,
    category: categories[0],
    tags: [],
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          event.title.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.category?.toLowerCase().includes(query) ||
          event.tags?.some((tag) => tag.toLowerCase().includes(query))
        if (!matchesSearch) return false
      }
      if (selectedColors.length > 0 && !selectedColors.includes(event.color)) return false
      if (selectedTags.length > 0) {
        const hasMatchingTag = event.tags?.some((tag) => selectedTags.includes(tag))
        if (!hasMatchingTag) return false
      }
      if (selectedCategories.length > 0 && event.category && !selectedCategories.includes(event.category)) return false
      return true
    })
  }, [events, searchQuery, selectedColors, selectedTags, selectedCategories])

  const hasActiveFilters = selectedColors.length > 0 || selectedTags.length > 0 || selectedCategories.length > 0

  const clearFilters = () => {
    setSelectedColors([])
    setSelectedTags([])
    setSelectedCategories([])
    setSearchQuery("")
  }

  const handleCreateEvent = useCallback(() => {
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) return
    const event: Event = {
      id: Math.random().toString(36).substr(2, 9),
      title: newEvent.title,
      description: newEvent.description,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      color: newEvent.color || colors[0].value,
      category: newEvent.category,
      attendees: newEvent.attendees,
      tags: newEvent.tags || [],
    }
    setEvents((prev) => [...prev, event])
    onEventCreate?.(event)
    setIsDialogOpen(false)
    setIsCreating(false)
    setNewEvent({ title: "", description: "", color: colors[0].value, category: categories[0], tags: [] })
  }, [newEvent, colors, categories, onEventCreate])

  const handleUpdateEvent = useCallback(() => {
    if (!selectedEvent) return
    setEvents((prev) => prev.map((e) => (e.id === selectedEvent.id ? selectedEvent : e)))
    onEventUpdate?.(selectedEvent.id, selectedEvent)
    setIsDialogOpen(false)
    setSelectedEvent(null)
  }, [selectedEvent, onEventUpdate])

  const handleDeleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
    onEventDelete?.(id)
    setIsDialogOpen(false)
    setSelectedEvent(null)
  }, [onEventDelete])

  const handleDragStart = useCallback((event: Event) => { setDraggedEvent(event) }, [])
  const handleDragEnd = useCallback(() => { setDraggedEvent(null) }, [])

  const handleDrop = useCallback((date: Date, hour?: number) => {
    if (!draggedEvent) return
    const duration = draggedEvent.endTime.getTime() - draggedEvent.startTime.getTime()
    const newStartTime = new Date(date)
    if (hour !== undefined) newStartTime.setHours(hour, 0, 0, 0)
    const newEndTime = new Date(newStartTime.getTime() + duration)
    const updatedEvent = { ...draggedEvent, startTime: newStartTime, endTime: newEndTime }
    setEvents((prev) => prev.map((e) => (e.id === draggedEvent.id ? updatedEvent : e)))
    onEventUpdate?.(draggedEvent.id, updatedEvent)
    setDraggedEvent(null)
  }, [draggedEvent, onEventUpdate])

  const navigateDate = useCallback((direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (view === "month") newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1))
      else if (view === "week") newDate.setDate(prev.getDate() + (direction === "next" ? 7 : -7))
      else if (view === "day") newDate.setDate(prev.getDate() + (direction === "next" ? 1 : -1))
      return newDate
    })
  }, [view])

  const getColorClasses = useCallback((colorValue: string) => {
    return colors.find((c) => c.value === colorValue) || colors[0]
  }, [colors])

  const toggleTag = (tag: string, creating: boolean) => {
    if (creating) {
      setNewEvent((prev) => ({
        ...prev,
        tags: prev.tags?.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...(prev.tags || []), tag],
      }))
    } else {
      setSelectedEvent((prev) =>
        prev ? {
          ...prev,
          tags: prev.tags?.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...(prev.tags || []), tag],
        } : null
      )
    }
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <h2 className="text-xl font-semibold sm:text-2xl">
            {view === "month" && currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            {view === "week" && `Week of ${currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
            {view === "day" && currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            {view === "list" && "All Events"}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateDate("prev")} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
            <Button variant="outline" size="icon" onClick={() => navigateDate("next")} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="sm:hidden">
            <Select value={view} onValueChange={(value: "month" | "week" | "day" | "list") => setView(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month"><div className="flex items-center gap-2"><Calendar className="h-4 w-4" />Month View</div></SelectItem>
                <SelectItem value="week"><div className="flex items-center gap-2"><Grid3x3 className="h-4 w-4" />Week View</div></SelectItem>
                <SelectItem value="day"><div className="flex items-center gap-2"><Clock className="h-4 w-4" />Day View</div></SelectItem>
                <SelectItem value="list"><div className="flex items-center gap-2"><List className="h-4 w-4" />List View</div></SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="hidden sm:flex items-center gap-1 rounded-lg border bg-background p-1">
            {(["month", "week", "day", "list"] as const).map((v) => (
              <Button key={v} variant={view === v ? "secondary" : "ghost"} size="sm" onClick={() => setView(v)} className="h-8 capitalize">
                {v === "month" && <Calendar className="h-4 w-4 mr-1" />}
                {v === "week" && <Grid3x3 className="h-4 w-4 mr-1" />}
                {v === "day" && <Clock className="h-4 w-4 mr-1" />}
                {v === "list" && <List className="h-4 w-4 mr-1" />}
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </Button>
            ))}
          </div>

          <Button onClick={() => { setIsCreating(true); setIsDialogOpen(true) }} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />New Event
          </Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search events..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          {searchQuery && (
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2" onClick={() => setSearchQuery("")}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: "Colors", items: colors, key: "value", display: (c: typeof colors[0]) => <div className="flex items-center gap-2"><div className={cn("h-3 w-3 rounded", c.bg)} />{c.name}</div>, selected: selectedColors, setSelected: setSelectedColors },
            { label: "Tags", items: availableTags.map(t => ({ value: t, name: t })), key: "value", display: (t: { value: string; name: string }) => t.name, selected: selectedTags, setSelected: setSelectedTags },
            { label: "Categories", items: categories.map(c => ({ value: c, name: c })), key: "value", display: (c: { value: string; name: string }) => c.name, selected: selectedCategories, setSelected: setSelectedCategories },
          ].map(({ label, items, display, selected, setSelected }) => (
            <DropdownMenu key={label}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Filter className="h-4 w-4" />{label}
                  {selected.length > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1">{selected.length}</Badge>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter by {label.slice(0, -1)}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(items as { value: string; name: string }[]).map((item) => (
                  <DropdownMenuCheckboxItem
                    key={item.value}
                    checked={selected.includes(item.value)}
                    onCheckedChange={(checked) =>
                      setSelected((prev: string[]) => checked ? [...prev, item.value] : prev.filter((v) => v !== item.value))
                    }
                  >
                    {display(item as never)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
              <X className="h-4 w-4" />Clear
            </Button>
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {selectedColors.map((colorValue) => {
            const color = getColorClasses(colorValue)
            return (
              <Badge key={colorValue} variant="secondary" className="gap-1">
                <div className={cn("h-2 w-2 rounded-full", color.bg)} />{color.name}
                <button onClick={() => setSelectedColors((prev) => prev.filter((c) => c !== colorValue))} className="ml-1 hover:text-foreground"><X className="h-3 w-3" /></button>
              </Badge>
            )
          })}
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">{tag}
              <button onClick={() => setSelectedTags((prev) => prev.filter((t) => t !== tag))} className="ml-1 hover:text-foreground"><X className="h-3 w-3" /></button>
            </Badge>
          ))}
          {selectedCategories.map((category) => (
            <Badge key={category} variant="secondary" className="gap-1">{category}
              <button onClick={() => setSelectedCategories((prev) => prev.filter((c) => c !== category))} className="ml-1 hover:text-foreground"><X className="h-3 w-3" /></button>
            </Badge>
          ))}
        </div>
      )}

      {/* Views */}
      {view === "month" && <MonthView currentDate={currentDate} events={filteredEvents} onEventClick={(e) => { setSelectedEvent(e); setIsDialogOpen(true) }} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDrop={handleDrop} getColorClasses={getColorClasses} />}
      {view === "week" && <WeekView currentDate={currentDate} events={filteredEvents} onEventClick={(e) => { setSelectedEvent(e); setIsDialogOpen(true) }} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDrop={handleDrop} getColorClasses={getColorClasses} />}
      {view === "day" && <DayView currentDate={currentDate} events={filteredEvents} onEventClick={(e) => { setSelectedEvent(e); setIsDialogOpen(true) }} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDrop={handleDrop} getColorClasses={getColorClasses} />}
      {view === "list" && <ListView events={filteredEvents} onEventClick={(e) => { setSelectedEvent(e); setIsDialogOpen(true) }} getColorClasses={getColorClasses} />}

      {/* Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isCreating ? "Create Event" : "Event Details"}</DialogTitle>
            <DialogDescription>{isCreating ? "Add a new event to your calendar" : "View and edit event details"}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={isCreating ? newEvent.title : selectedEvent?.title} onChange={(e) => isCreating ? setNewEvent((prev) => ({ ...prev, title: e.target.value })) : setSelectedEvent((prev) => prev ? { ...prev, title: e.target.value } : null)} placeholder="Event title" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={isCreating ? newEvent.description : selectedEvent?.description} onChange={(e) => isCreating ? setNewEvent((prev) => ({ ...prev, description: e.target.value })) : setSelectedEvent((prev) => prev ? { ...prev, description: e.target.value } : null)} placeholder="Event description" rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {(["startTime", "endTime"] as const).map((field) => (
                <div key={field} className="space-y-2">
                  <Label htmlFor={field}>{field === "startTime" ? "Start Time" : "End Time"}</Label>
                  <Input
                    id={field}
                    type="datetime-local"
                    value={(() => {
                      const d = isCreating ? newEvent[field] : selectedEvent?.[field]
                      if (!d) return ""
                      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                    })()}
                    onChange={(e) => {
                      const date = new Date(e.target.value)
                      isCreating ? setNewEvent((prev) => ({ ...prev, [field]: date })) : setSelectedEvent((prev) => prev ? { ...prev, [field]: date } : null)
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={isCreating ? newEvent.category : selectedEvent?.category} onValueChange={(v) => isCreating ? setNewEvent((prev) => ({ ...prev, category: v })) : setSelectedEvent((prev) => prev ? { ...prev, category: v } : null)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Select value={isCreating ? newEvent.color : selectedEvent?.color} onValueChange={(v) => isCreating ? setNewEvent((prev) => ({ ...prev, color: v })) : setSelectedEvent((prev) => prev ? { ...prev, color: v } : null)}>
                  <SelectTrigger><SelectValue placeholder="Select color" /></SelectTrigger>
                  <SelectContent>{colors.map((color) => <SelectItem key={color.value} value={color.value}><div className="flex items-center gap-2"><div className={cn("h-4 w-4 rounded", color.bg)} />{color.name}</div></SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const isSelected = isCreating ? newEvent.tags?.includes(tag) : selectedEvent?.tags?.includes(tag)
                  return <Badge key={tag} variant={isSelected ? "default" : "outline"} className="cursor-pointer hover:scale-105 transition-transform" onClick={() => toggleTag(tag, isCreating)}>{tag}</Badge>
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            {!isCreating && <Button variant="destructive" onClick={() => selectedEvent && handleDeleteEvent(selectedEvent.id)}>Delete</Button>}
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); setIsCreating(false); setSelectedEvent(null) }}>Cancel</Button>
            <Button onClick={isCreating ? handleCreateEvent : handleUpdateEvent}>{isCreating ? "Create" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Internal sub-components ──────────────────────────────────────────────────

function EventChip({ event, onEventClick, onDragStart, onDragEnd, getColorClasses, variant = "default" }: {
  event: Event
  onEventClick: (e: Event) => void
  onDragStart: (e: Event) => void
  onDragEnd: () => void
  getColorClasses: (c: string) => { bg: string; text: string }
  variant?: "default" | "compact" | "detailed"
}) {
  const [hovered, setHovered] = useState(false)
  const color = getColorClasses(event.color)
  const formatTime = (d: Date) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })

  if (variant === "compact") {
    return (
      <div draggable onDragStart={() => onDragStart(event)} onDragEnd={onDragEnd} onClick={() => onEventClick(event)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} className="relative cursor-pointer">
        <div className={cn("rounded px-1.5 py-0.5 text-xs font-medium text-white truncate transition-all", color.bg, hovered && "scale-105 shadow-lg")}>{event.title}</div>
        {hovered && (
          <div className="absolute left-0 top-full z-50 mt-1 w-64 animate-in fade-in slide-in-from-top-2 duration-200">
            <Card className="border-2 p-3 shadow-xl">
              <p className="font-semibold text-sm">{event.title}</p>
              {event.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>}
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1"><Clock className="h-3 w-3" />{formatTime(event.startTime)} – {formatTime(event.endTime)}</div>
            </Card>
          </div>
        )}
      </div>
    )
  }

  if (variant === "detailed") {
    return (
      <div draggable onDragStart={() => onDragStart(event)} onDragEnd={onDragEnd} onClick={() => onEventClick(event)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        className={cn("cursor-pointer rounded-lg p-3 text-white transition-all", color.bg, hovered && "scale-[1.02] shadow-xl")}>
        <p className="font-semibold">{event.title}</p>
        {event.description && <p className="text-sm opacity-90 mt-1 line-clamp-2">{event.description}</p>}
        <div className="flex items-center gap-1 text-xs opacity-80 mt-2"><Clock className="h-3 w-3" />{formatTime(event.startTime)} – {formatTime(event.endTime)}</div>
      </div>
    )
  }

  return (
    <div draggable onDragStart={() => onDragStart(event)} onDragEnd={onDragEnd} onClick={() => onEventClick(event)} className={cn("cursor-pointer rounded px-2 py-1 text-xs font-medium text-white truncate transition-all", color.bg, "hover:scale-105 hover:shadow-md")}>
      {event.title}
    </div>
  )
}

function MonthView({ currentDate, events, onEventClick, onDragStart, onDragEnd, onDrop, getColorClasses }: {
  currentDate: Date; events: Event[]; onEventClick: (e: Event) => void
  onDragStart: (e: Event) => void; onDragEnd: () => void; onDrop: (d: Date) => void
  getColorClasses: (c: string) => { bg: string; text: string }
}) {
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - startDate.getDay())
  const days = Array.from({ length: 42 }, (_, i) => { const d = new Date(startDate); d.setDate(startDate.getDate() + i); return d })

  const getEventsForDay = (date: Date) => events.filter((e) => {
    const ed = new Date(e.startTime)
    return ed.getDate() === date.getDate() && ed.getMonth() === date.getMonth() && ed.getFullYear() === date.getFullYear()
  })

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 border-b">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="border-r p-2 text-center text-xs font-medium last:border-r-0 sm:text-sm">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayEvents = getEventsForDay(day)
          const isCurrentMonth = day.getMonth() === currentDate.getMonth()
          const isToday = day.toDateString() === new Date().toDateString()
          return (
            <div key={i} className={cn("min-h-20 border-b border-r p-1 last:border-r-0 hover:bg-accent/50 transition-colors sm:min-h-24 sm:p-2", !isCurrentMonth && "bg-muted/30")} onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(day)}>
              <div className={cn("mb-1 flex h-5 w-5 items-center justify-center rounded-full text-xs sm:h-6 sm:w-6 sm:text-sm", isToday && "bg-primary text-primary-foreground font-semibold")}>{day.getDate()}</div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((e) => <EventChip key={e.id} event={e} onEventClick={onEventClick} onDragStart={onDragStart} onDragEnd={onDragEnd} getColorClasses={getColorClasses} variant="compact" />)}
                {dayEvents.length > 3 && <div className="text-[10px] text-muted-foreground">+{dayEvents.length - 3} more</div>}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function WeekView({ currentDate, events, onEventClick, onDragStart, onDragEnd, onDrop, getColorClasses }: {
  currentDate: Date; events: Event[]; onEventClick: (e: Event) => void
  onDragStart: (e: Event) => void; onDragEnd: () => void; onDrop: (d: Date, h: number) => void
  getColorClasses: (c: string) => { bg: string; text: string }
}) {
  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i); return d })
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const getEventsForSlot = (date: Date, hour: number) => events.filter((e) => {
    const ed = new Date(e.startTime)
    return ed.getDate() === date.getDate() && ed.getMonth() === date.getMonth() && ed.getFullYear() === date.getFullYear() && ed.getHours() === hour
  })

  return (
    <Card className="overflow-auto">
      <div className="grid grid-cols-8 border-b">
        <div className="border-r p-2 text-xs font-medium text-center">Time</div>
        {weekDays.map((d) => (
          <div key={d.toISOString()} className="border-r p-2 text-center text-xs font-medium last:border-r-0">
            <div>{d.toLocaleDateString("en-US", { weekday: "short" })}</div>
            <div className="text-muted-foreground text-[10px]">{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-8">
        {hours.map((hour) => (
          <>
            <div key={`t-${hour}`} className="border-b border-r p-1 text-[10px] text-muted-foreground sm:p-2 sm:text-xs">{String(hour).padStart(2, "0")}:00</div>
            {weekDays.map((day) => {
              const slotEvents = getEventsForSlot(day, hour)
              return (
                <div key={`${day.toISOString()}-${hour}`} className="min-h-12 border-b border-r p-0.5 hover:bg-accent/50 transition-colors last:border-r-0 sm:min-h-16 sm:p-1" onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(day, hour)}>
                  <div className="space-y-0.5">{slotEvents.map((e) => <EventChip key={e.id} event={e} onEventClick={onEventClick} onDragStart={onDragStart} onDragEnd={onDragEnd} getColorClasses={getColorClasses} />)}</div>
                </div>
              )
            })}
          </>
        ))}
      </div>
    </Card>
  )
}

function DayView({ currentDate, events, onEventClick, onDragStart, onDragEnd, onDrop, getColorClasses }: {
  currentDate: Date; events: Event[]; onEventClick: (e: Event) => void
  onDragStart: (e: Event) => void; onDragEnd: () => void; onDrop: (d: Date, h: number) => void
  getColorClasses: (c: string) => { bg: string; text: string }
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const getEventsForHour = (hour: number) => events.filter((e) => {
    const ed = new Date(e.startTime)
    return ed.getDate() === currentDate.getDate() && ed.getMonth() === currentDate.getMonth() && ed.getFullYear() === currentDate.getFullYear() && ed.getHours() === hour
  })

  return (
    <Card className="overflow-auto">
      {hours.map((hour) => {
        const hourEvents = getEventsForHour(hour)
        return (
          <div key={hour} className="flex border-b last:border-b-0" onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(currentDate, hour)}>
            <div className="w-14 shrink-0 border-r p-2 text-xs text-muted-foreground sm:w-20 sm:p-3 sm:text-sm">{String(hour).padStart(2, "0")}:00</div>
            <div className="min-h-16 flex-1 p-1 hover:bg-accent/50 transition-colors sm:min-h-20 sm:p-2">
              <div className="space-y-1">{hourEvents.map((e) => <EventChip key={e.id} event={e} onEventClick={onEventClick} onDragStart={onDragStart} onDragEnd={onDragEnd} getColorClasses={getColorClasses} variant="detailed" />)}</div>
            </div>
          </div>
        )
      })}
    </Card>
  )
}

function ListView({ events, onEventClick, getColorClasses }: {
  events: Event[]; onEventClick: (e: Event) => void
  getColorClasses: (c: string) => { bg: string; text: string }
}) {
  const sorted = [...events].sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  const formatTime = (d: Date) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })

  if (sorted.length === 0) {
    return <Card className="p-12 text-center text-muted-foreground">No events found</Card>
  }

  return (
    <Card className="divide-y">
      {sorted.map((event) => {
        const color = getColorClasses(event.color)
        return (
          <div key={event.id} onClick={() => onEventClick(event)} className="flex items-start gap-4 p-4 hover:bg-accent/50 cursor-pointer transition-colors">
            <div className={cn("mt-1 h-3 w-3 shrink-0 rounded-full", color.bg)} />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{event.title}</p>
              {event.description && <p className="text-sm text-muted-foreground truncate mt-0.5">{event.description}</p>}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-muted-foreground">{event.startTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                <span className="text-xs text-muted-foreground">{formatTime(event.startTime)} – {formatTime(event.endTime)}</span>
                {event.category && <Badge variant="secondary" className="text-xs h-5">{event.category}</Badge>}
                {event.tags?.map((t) => <Badge key={t} variant="outline" className="text-xs h-5">{t}</Badge>)}
              </div>
            </div>
          </div>
        )
      })}
    </Card>
  )
}
