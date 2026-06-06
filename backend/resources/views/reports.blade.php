<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>StaySync {{ ucfirst($type) }} Report — {{ $generated_at }}</title>
    <style>
        @page { margin: 0; }
        * { box-sizing: border-box; }
        body {
            font-family: 'DejaVu Sans', 'Helvetica', sans-serif;
            font-size: 10.5px;
            color: #0f172a;
            margin: 0;
            padding: 0;
            line-height: 1.4;
        }
        .page { padding: 32px 36px; }

        /* Brand bar */
        .brand-bar {
            background: linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%);
            color: #ffffff;
            padding: 20px 32px;
        }
        .brand-bar table { width: 100%; border-collapse: collapse; }
        .brand-bar td { vertical-align: middle; }
        .logo-box {
            width: 52px; height: 52px;
            border-radius: 12px;
            background: rgba(255,255,255,0.18);
            text-align: center;
            color: #ffffff;
            font-weight: 700;
            font-size: 24px;
            line-height: 52px;
            border: 1px solid rgba(255,255,255,0.35);
        }
        .brand-name { font-size: 20px; font-weight: 700; margin: 0; }
        .brand-tag  { font-size: 9px; opacity: 0.85; margin: 2px 0 0 0; letter-spacing: 0.6px; text-transform: uppercase; }
        .doc-type   { text-align: right; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; opacity: 0.9; }
        .doc-ref    { font-size: 12px; font-weight: 700; margin-top: 2px; }

        /* Section */
        .section { margin-top: 22px; }
        .section-header {
            border-bottom: 2px solid #06b6d4;
            padding-bottom: 6px;
            margin-bottom: 10px;
        }
        .section-title {
            font-size: 13px;
            font-weight: 700;
            color: #0e7490;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            margin: 0;
        }
        .section-sub {
            font-size: 9.5px;
            color: #64748b;
            margin: 2px 0 0 0;
        }

        /* KPI cards */
        .kpi-row { width: 100%; border-collapse: collapse; margin-top: 4px; }
        .kpi-row td { width: 25%; padding: 4px; }
        .kpi {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 14px;
            background: #f8fafc;
        }
        .kpi-label { font-size: 8.5px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 700; }
        .kpi-value { font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 3px; }
        .kpi-sub   { font-size: 8.5px; color: #94a3b8; margin-top: 2px; }
        .kpi-cyan  { border-top: 3px solid #06b6d4; }
        .kpi-amber { border-top: 3px solid #f59e0b; }
        .kpi-green { border-top: 3px solid #22c55e; }
        .kpi-slate { border-top: 3px solid #475569; }

        /* Tables */
        table.data {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
        }
        table.data th {
            text-align: left;
            background: #f1f5f9;
            color: #475569;
            font-weight: 700;
            padding: 8px 10px;
            border-bottom: 1px solid #cbd5e1;
            text-transform: uppercase;
            font-size: 8.5px;
            letter-spacing: 0.6px;
        }
        table.data td {
            padding: 7px 10px;
            border-bottom: 1px solid #e2e8f0;
        }
        table.data tr:last-child td { border-bottom: none; }

        /* Bar chart */
        .bar-row { display: table; width: 100%; margin-bottom: 4px; }
        .bar-label { display: table-cell; width: 50px; font-size: 9.5px; color: #475569; font-weight: 600; }
        .bar-track {
            display: table-cell;
            vertical-align: middle;
            padding-right: 8px;
        }
        .bar-fill {
            height: 14px;
            background: linear-gradient(90deg, #06b6d4, #0891b2);
            border-radius: 3px;
        }
        .bar-value {
            display: table-cell;
            width: 90px;
            text-align: right;
            font-size: 9.5px;
            color: #0f172a;
            font-weight: 700;
            vertical-align: middle;
        }

        /* Status dots */
        .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; }
        .dot-green   { background: #22c55e; }
        .dot-blue    { background: #3b82f6; }
        .dot-sky     { background: #0ea5e9; }
        .dot-amber   { background: #f59e0b; }
        .dot-red     { background: #ef4444; }
        .dot-slate   { background: #475569; }

        /* Footer */
        .footer {
            margin-top: 28px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            font-size: 8.5px;
            color: #94a3b8;
            text-align: center;
        }
        .meta-line {
            margin-top: 10px;
            font-size: 9.5px;
            color: #475569;
        }
        .meta-line strong { color: #0f172a; }
    </style>
</head>
<body>
    <div class="brand-bar">
        <table>
            <tr>
                <td style="width: 64px;">
                    <div class="logo-box">SS</div>
                </td>
                <td>
                    <p class="brand-name">{{ $hotel['name'] }}</p>
                    <p class="brand-tag">{{ $hotel['tagline'] }}</p>
                </td>
                <td class="doc-type" style="width: 220px;">
                    Report Type<br>
                    <span class="doc-ref">{{ strtoupper($type) }} REPORT</span>
                </td>
            </tr>
        </table>
    </div>

    <div class="page">

        <p class="meta-line">
            <strong>Date range:</strong> {{ ucfirst($date_range) }} ·
            <strong>Generated:</strong> {{ $generated_at }} ·
            <strong>Reference:</strong> RPT-{{ strtoupper(substr(md5($generated_at), 0, 8)) }}
        </p>

        @if($type === 'full' || $type === 'revenue')
        <div class="section">
            <div class="section-header">
                <p class="section-title">Revenue Performance</p>
                <p class="section-sub">Payments received + booking revenue for non-cancelled reservations</p>
            </div>
            <table class="kpi-row">
                <tr>
                    <td>
                        <div class="kpi kpi-cyan">
                            <p class="kpi-label">Today</p>
                            <p class="kpi-value">KES {{ number_format($revenue['today']) }}</p>
                            <p class="kpi-sub">Single day total</p>
                        </div>
                    </td>
                    <td>
                        <div class="kpi kpi-green">
                            <p class="kpi-label">This Month</p>
                            <p class="kpi-value">KES {{ number_format($revenue['month']) }}</p>
                            <p class="kpi-sub">{{ date('F Y') }}</p>
                        </div>
                    </td>
                    <td>
                        <div class="kpi kpi-amber">
                            <p class="kpi-label">This Year</p>
                            <p class="kpi-value">KES {{ number_format($revenue['year']) }}</p>
                            <p class="kpi-sub">Year to date</p>
                        </div>
                    </td>
                    <td>
                        <div class="kpi kpi-slate">
                            <p class="kpi-label">All Time</p>
                            <p class="kpi-value">KES {{ number_format($revenue['total']) }}</p>
                            <p class="kpi-sub">Cumulative revenue</p>
                        </div>
                    </td>
                </tr>
            </table>

            @php
                $maxRev = max(array_map(fn($r) => (float)$r->total, $monthly_revenue)) ?: 1;
            @endphp
            <div style="margin-top: 14px;">
                <p style="font-size: 10px; font-weight: 700; color: #475569; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.6px;">Monthly Revenue Breakdown</p>
                @foreach($monthly_revenue as $row)
                    @php
                        $pct = max(2, round(((float)$row->total / $maxRev) * 100));
                    @endphp
                    <div class="bar-row">
                        <div class="bar-label">{{ $month_names[((int)$row->month) - 1] ?? $row->month }}</div>
                        <div class="bar-track">
                            <div class="bar-fill" style="width: {{ $pct }}%;"></div>
                        </div>
                        <div class="bar-value">KES {{ number_format($row->total) }}</div>
                    </div>
                @endforeach
            </div>
        </div>
        @endif

        @if($type === 'full' || $type === 'bookings')
        <div class="section">
            <div class="section-header">
                <p class="section-title">Booking Activity</p>
                <p class="section-sub">Status distribution and monthly reservation volume</p>
            </div>

            <table class="data">
                <thead>
                    <tr>
                        <th style="width: 40%;">Status</th>
                        <th style="text-align: right;">Count</th>
                        <th style="text-align: right;">% of Total</th>
                    </tr>
                </thead>
                <tbody>
                    @php
                        $rows = [
                            ['Confirmed',   $bookings['confirmed'],   '#22c55e'],
                            ['Checked In',  $bookings['checked_in'],  '#3b82f6'],
                            ['Checked Out', $bookings['checked_out'], '#0ea5e9'],
                            ['Pending',     $bookings['pending'],     '#f59e0b'],
                            ['Cancelled',   $bookings['cancelled'],   '#ef4444'],
                        ];
                        $totalBookings = max(1, $bookings['total']);
                    @endphp
                    @foreach($rows as [$label, $count, $color])
                        <tr>
                            <td><span class="dot" style="background: {{ $color }}"></span>{{ $label }}</td>
                            <td style="text-align: right; font-weight: 700;">{{ $count }}</td>
                            <td style="text-align: right; color: #64748b;">{{ round(($count / $totalBookings) * 100, 1) }}%</td>
                        </tr>
                    @endforeach
                    <tr style="background: #f8fafc;">
                        <td style="font-weight: 700;">Total Bookings</td>
                        <td style="text-align: right; font-weight: 700;">{{ $bookings['total'] }}</td>
                        <td style="text-align: right; color: #64748b;">100%</td>
                    </tr>
                </tbody>
            </table>

            @php
                $maxBk = max(array_map(fn($r) => (int)$r->total, $monthly_bookings)) ?: 1;
            @endphp
            <div style="margin-top: 14px;">
                <p style="font-size: 10px; font-weight: 700; color: #475569; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.6px;">Monthly Booking Volume</p>
                @foreach($monthly_bookings as $row)
                    @php
                        $pct = max(2, round(((int)$row->total / $maxBk) * 100));
                    @endphp
                    <div class="bar-row">
                        <div class="bar-label">{{ $month_names[((int)$row->month) - 1] ?? $row->month }}</div>
                        <div class="bar-track">
                            <div class="bar-fill" style="width: {{ $pct }}%; background: linear-gradient(90deg, #22c55e, #16a34a);"></div>
                        </div>
                        <div class="bar-value">{{ $row->total }} bookings</div>
                    </div>
                @endforeach
            </div>
        </div>
        @endif

        @if($type === 'full' || $type === 'occupancy')
        <div class="section">
            <div class="section-header">
                <p class="section-title">Room Occupancy</p>
                <p class="section-sub">Live room status snapshot — active bookings as of report generation</p>
            </div>

            <table class="kpi-row">
                <tr>
                    <td>
                        <div class="kpi kpi-cyan">
                            <p class="kpi-label">Total Rooms</p>
                            <p class="kpi-value">{{ $occupancy['total_rooms'] }}</p>
                            <p class="kpi-sub">Active inventory</p>
                        </div>
                    </td>
                    <td>
                        <div class="kpi kpi-green">
                            <p class="kpi-label">Available</p>
                            <p class="kpi-value">{{ $occupancy['available_rooms'] }}</p>
                            <p class="kpi-sub">Ready to assign</p>
                        </div>
                    </td>
                    <td>
                        <div class="kpi kpi-amber">
                            <p class="kpi-label">Occupied</p>
                            <p class="kpi-value">{{ $occupancy['occupied_rooms'] }}</p>
                            <p class="kpi-sub">Currently in-house</p>
                        </div>
                    </td>
                    <td>
                        <div class="kpi kpi-slate">
                            <p class="kpi-label">Occupancy Rate</p>
                            <p class="kpi-value">{{ $occupancy['occupancy_rate'] }}</p>
                            <p class="kpi-sub">Live</p>
                        </div>
                    </td>
                </tr>
            </table>

            <table class="data" style="margin-top: 14px;">
                <thead>
                    <tr>
                        <th>Status</th>
                        <th style="text-align: right;">Count</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><span class="dot dot-green"></span>Available</td>
                        <td style="text-align: right; font-weight: 700;">{{ $occupancy['available_rooms'] }}</td>
                    </tr>
                    <tr>
                        <td><span class="dot dot-blue"></span>Occupied</td>
                        <td style="text-align: right; font-weight: 700;">{{ $occupancy['occupied_rooms'] }}</td>
                    </tr>
                    <tr>
                        <td><span class="dot dot-amber"></span>Dirty</td>
                        <td style="text-align: right; font-weight: 700;">{{ $occupancy['dirty_rooms'] }}</td>
                    </tr>
                    <tr>
                        <td><span class="dot dot-slate"></span>Maintenance</td>
                        <td style="text-align: right; font-weight: 700;">{{ $occupancy['maintenance_rooms'] }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        @endif

        <div class="footer">
            {{ $hotel['name'] }} · Confidential management report · Generated by StaySync HMS
        </div>
    </div>
</body>
</html>
